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

import React, { useState } from 'react';
import styled from 'styled-components';
import { Popover, Box } from 'design';

type Props = {
  borderRadius?: number;
  badgeTitle: string;
  sticky?: boolean;
  color: string;
};

export const ToolTipBadge: React.FC<Props> = ({
  children,
  borderRadius = 2,
  badgeTitle,
  sticky = false,
  color,
}) => {
  const [anchorEl, setAnchorEl] = useState();
  const open = Boolean(anchorEl);

  function handlePopoverOpen(event) {
    setAnchorEl(event.currentTarget);
  }

  function handlePopoverClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Box
        data-testid="tooltip"
        aria-owns={open ? 'mouse-over-popover' : undefined}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={!sticky ? handlePopoverClose : undefined}
        borderTopRightRadius={borderRadius}
        borderBottomLeftRadius={borderRadius}
        bg={color}
        css={`
          position: absolute;
          padding: 0px 6px;
          top: 0px;
          right: 0px;
          font-size: 10px;
        `}
      >
        {badgeTitle}
      </Box>
      <Popover
        modalCss={() => `pointer-events: ${sticky ? 'auto' : 'none'}`}
        onClose={handlePopoverClose}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <StyledOnHover
          px={3}
          py={2}
          data-testid="tooltip-msg"
          onMouseLeave={handlePopoverClose}
        >
          {children}
        </StyledOnHover>
      </Popover>
    </>
  );
};

const StyledOnHover = styled(Box)`
  background-color: white;
  color: black;
  max-width: 350px;
`;
