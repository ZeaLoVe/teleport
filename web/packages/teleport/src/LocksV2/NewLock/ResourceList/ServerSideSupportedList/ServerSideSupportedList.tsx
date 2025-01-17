/**
 * Teleport
 * Copyright (C) 2023  Gravitational, Inc.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SortType } from 'design/DataTable/types';
import { Flex } from 'design';
import { StyledPanel } from 'design/DataTable/StyledTable';
import { SearchPanel } from 'shared/components/Search';
import { StyledArrowBtn } from 'design/DataTable/Pager/StyledPager';
import { CircleArrowLeft, CircleArrowRight } from 'design/Icon';

import { Desktop } from 'teleport/services/desktops';
import { Node } from 'teleport/services/nodes';
import { useServerSidePagination } from 'teleport/components/hooks';
import useTeleport from 'teleport/useTeleport';
import cfg from 'teleport/config';
import Ctx from 'teleport/teleportContext';

import { TableWrapper, ServerSideListProps } from '../common';
import { CommonListProps, LockResourceKind } from '../../common';

import { Nodes } from './Nodes';
import { Desktops } from './Desktops';

import type { ResourceLabel, ResourceFilter } from 'teleport/services/agents';

export function ServerSideSupportedList(props: CommonListProps) {
  const ctx = useTeleport();

  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>({});

  const {
    fetchStatus,
    fetchNext,
    fetchPrev,
    fetch,
    attempt: fetchAttempt,
    pageIndicators,
    fetchedData,
  } = useServerSidePagination({
    fetchFunc: getFetchFuncForServerSidePaginating(
      ctx,
      props.selectedResourceKind
    ) as any,
    clusterId: cfg.proxyCluster, // Locking only supported with root cluster
    params: resourceFilter,
    pageSize: props.pageSize,
  });

  useEffect(() => {
    // Resetting the filter will trigger a fetch.
    setResourceFilter({
      sort: getDefaultSort(props.selectedResourceKind),
      search: '',
      query: '',
    });
  }, [props.selectedResourceKind]);

  useEffect(() => {
    fetch();
  }, [resourceFilter]);

  useEffect(() => {
    props.setAttempt(fetchAttempt);
  }, [fetchAttempt]);

  function updateSort(sort: SortType) {
    setResourceFilter({ ...resourceFilter, sort });
  }

  function updateSearch(search: string) {
    setResourceFilter({ ...resourceFilter, query: '', search });
  }

  function updateQuery(query: string) {
    setResourceFilter({ ...resourceFilter, search: '', query });
  }

  function onResourceLabelClick(label: ResourceLabel) {
    const query = addResourceLabelToQuery(resourceFilter, label);
    setResourceFilter({ ...resourceFilter, search: '', query });
  }

  const table = useMemo(() => {
    const listProps: ServerSideListProps = {
      fetchStatus,
      customSort: {
        dir: resourceFilter.sort?.dir,
        fieldName: resourceFilter.sort?.fieldName,
        onSort: updateSort,
      },
      onLabelClick: onResourceLabelClick,
      selectedResources: props.selectedResources,
      toggleSelectResource: props.toggleSelectResource,
    };

    switch (props.selectedResourceKind) {
      case 'node':
        return <Nodes nodes={fetchedData.agents as Node[]} {...listProps} />;
      case 'windows_desktop':
        return (
          <Desktops desktops={fetchedData.agents as Desktop[]} {...listProps} />
        );
      default:
        console.error(
          `[ServerSideSupportedList.tsx] table not defined for resource kind ${props.selectedResourceKind}`
        );
    }
  }, [props.attempt, fetchedData, fetchStatus, props.selectedResources]);

  return (
    <TableWrapper
      className={fetchStatus === 'loading' ? 'disabled' : ''}
      css={`
        border-radius: 8px;
        overflow: hidden;
        box-shadow: ${props => props.theme.boxShadow[0]};
      `}
    >
      <SearchPanel
        updateQuery={updateQuery}
        updateSearch={updateSearch}
        pageIndicators={{
          from: pageIndicators.from,
          to: pageIndicators.to,
          total: pageIndicators.totalCount,
        }}
        filter={resourceFilter}
        showSearchBar={true}
        disableSearch={fetchStatus === 'loading'}
      />
      {table}
      <StyledPanel borderBottomLeftRadius={3} borderBottomRightRadius={3}>
        <Flex justifyContent="flex-end" width="100%">
          <Flex alignItems="center" mr={2}></Flex>
          <Flex>
            <StyledArrowBtn
              onClick={fetchPrev}
              title="Previous page"
              disabled={!fetchPrev || fetchStatus === 'loading'}
              mx={0}
            >
              <CircleArrowLeft />
            </StyledArrowBtn>
            <StyledArrowBtn
              ml={0}
              onClick={fetchNext}
              title="Next page"
              disabled={!fetchNext || fetchStatus === 'loading'}
            >
              <CircleArrowRight />
            </StyledArrowBtn>
          </Flex>
        </Flex>
      </StyledPanel>
    </TableWrapper>
  );
}

function getDefaultSort(kind: LockResourceKind): SortType {
  if (kind === 'node') {
    return { fieldName: 'hostname', dir: 'ASC' };
  }
  return { fieldName: 'name', dir: 'ASC' };
}

function getFetchFuncForServerSidePaginating(
  ctx: Ctx,
  resourceKind: LockResourceKind
) {
  if (resourceKind === 'node') {
    return ctx.nodeService.fetchNodes;
  }

  if (resourceKind === 'windows_desktop') {
    return ctx.desktopService.fetchDesktops;
  }
}

function addResourceLabelToQuery(filter: ResourceFilter, label: ResourceLabel) {
  const queryParts = [];

  // Add existing query
  if (filter.query) {
    queryParts.push(filter.query);
  }

  // If there is an existing simple search,
  // convert it to predicate language and add it
  if (filter.search) {
    queryParts.push(`search("${filter.search}")`);
  }

  // Create the label query.
  queryParts.push(`labels["${label.name}"] == "${label.value}"`);

  return queryParts.join(' && ');
}
