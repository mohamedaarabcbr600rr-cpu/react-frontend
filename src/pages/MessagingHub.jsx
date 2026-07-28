import React, { useState } from "react";
import Messagerie from "./Messagerie";
import GroupsPanel from "./groups/GroupsPanel";
import "./MessagingHub.css";

const MessagingHub = ({ authUserId }) => {
  const [activeSection, setActiveSection] = useState(() =>
    localStorage.getItem('pending_group_invite') ? "groups" : "messages"
  ); // "messages" | "groups"
  const [groupChatOpen, setGroupChatOpen] = useState(false);

  return (
    <div className="msg-hub-root">
      <div className="msg-hub-content">
        {activeSection === "messages" && (
          <Messagerie
            authUserId={authUserId}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        )}
        {activeSection === "groups" && (
          <GroupsPanel
            authUserId={authUserId}
            onGroupOpenChange={setGroupChatOpen}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        )}
      </div>
    </div>
  );
};

export default MessagingHub;