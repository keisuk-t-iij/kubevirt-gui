import { useShow, IResourceComponentsProps } from "@refinedev/core";
import { Show } from "@refinedev/mui";
import { Typography, Box, IconButton, Tooltip, Snackbar, Alert } from "@mui/material";
import { dump } from "js-yaml";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from "react";

export const DataVolumeShow: React.FC<IResourceComponentsProps> = () => {
    const showResult = useShow();
    const { query } = showResult;
    const { data, isLoading } = query || {};
    const [open, setOpen] = useState(false);

    const record = data?.data;

    let yamlContent = "";
    try {
        if (record) {
            const { id, ...rest } = record;
            yamlContent = dump(rest);
        } else {
            yamlContent = "No record found.";
        }
    } catch (error) {
        console.error("YAML Dump Error:", error);
        yamlContent = "Error parsing YAML.";
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(yamlContent);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    if (isLoading) return <div>Loading...</div>;
    if (!record) return <div>No Record Found</div>;

    return (
        <Show isLoading={isLoading} title={<Typography variant="h5">DataVolume YAML</Typography>}>
            <Box sx={{ position: "relative", bgcolor: "#f5f5f5", p: 2, borderRadius: 1, overflow: "auto" }}>
                <Tooltip title="Copy to Clipboard">
                    <IconButton
                        onClick={handleCopy}
                        sx={{ position: "absolute", top: 8, right: 8 }}
                    >
                        <ContentCopyIcon />
                    </IconButton>
                </Tooltip>
                <pre style={{ margin: 0, fontFamily: "monospace" }}>
                    {yamlContent}
                </pre>
            </Box>
            <Snackbar open={open} autoHideDuration={3000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    Copied to clipboard!
                </Alert>
            </Snackbar>
        </Show>
    );
};
