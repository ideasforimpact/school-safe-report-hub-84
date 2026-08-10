import React from 'react';

interface StudentOriginBadgeProps {
  /**
   * Whether the student belongs to a connected (linked) school rather than this client.
   * Pass the value stored ON THE RECORD - never derive it from the client's current
   * link status. A client can unlink after records were created, and those records
   * must keep showing the origin that was true when the student was selected.
   */
  isExternal?: boolean | null;
  /**
   * Whether an "Internal" tag is meaningful here. Internal is only worth labelling when
   * external students can appear alongside it (client is linked, or the record set being
   * shown contains an external student). Clients that never link would otherwise get a
   * redundant tag on every single student.
   *
   * This never affects external students - those are always tagged, so historical records
   * stay readable after the client unlinks.
   */
  showWhenInternal?: boolean;
  className?: string;
}

/**
 * Internal / External origin tag for a student.
 * Single source of truth so every surface (incident view, well-being view,
 * search dropdowns) labels students identically.
 */
const StudentOriginBadge: React.FC<StudentOriginBadgeProps> = ({
  isExternal,
  showWhenInternal = false,
  className = '',
}) => {
  if (!isExternal && !showWhenInternal) return null;

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded whitespace-nowrap ${
        isExternal ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      } ${className}`}
    >
      {isExternal ? 'External' : 'Internal'}
    </span>
  );
};

export default StudentOriginBadge;
