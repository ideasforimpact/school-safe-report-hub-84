
import React from 'react';
import StatusBlocks from '../../charts/StatusBlocks';

interface StatusBlocksWrapperProps {
  data: Array<{name: string, value: number}>;
}

const StatusBlocksWrapper: React.FC<StatusBlocksWrapperProps> = ({ data }) => {
  return (
    <div className="w-full">
      <StatusBlocks data={data} />
    </div>
  );
};

export default StatusBlocksWrapper;
