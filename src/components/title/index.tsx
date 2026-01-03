import React from "react";
import { ThemedTitle } from "@refinedev/mui";

export const Title: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
    return (
        <ThemedTitle
            collapsed={collapsed}
            text="IKE Virtualization"
        />
    );
};
