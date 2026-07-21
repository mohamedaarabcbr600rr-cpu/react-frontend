import React from "react";
import { getBadgeForCount } from "../utils/badges";

const AvatarBorder = ({ referralCount, children, size = 48 }) => {
  const badge = getBadgeForCount(referralCount || 0);

  if (!badge) {
    return <>{children}</>;
  }

  const [c1, c2] = badge.color;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        padding: 2,
        background: `linear-gradient(135deg, ${c1}, ${c2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={badge.name}
    >
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
};

export default AvatarBorder;