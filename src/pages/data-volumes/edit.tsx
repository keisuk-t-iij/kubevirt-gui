import { Edit } from "@refinedev/mui";
import { Typography } from "@mui/material";

export const DataVolumeEdit = () => {
    return (
        <Edit>
            <Typography variant="body1">
                Editing DataVolume resources is complex and typically requires recreating the resource for source changes.
                Full edit functionality is not yet implemented in this view.
            </Typography>
        </Edit>
    );
};
