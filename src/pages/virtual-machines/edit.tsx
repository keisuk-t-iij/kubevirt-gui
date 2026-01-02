import { Edit } from "@refinedev/mui";
import { Box, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

export const VirtualMachineEdit = () => {
    const {
        saveButtonProps,
        refineCore: { queryResult }
    } = useForm({} as any) as any;

    const record = queryResult?.data?.data;

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                autoComplete="off"
            >
                <Typography variant="body1">
                    Editing VirtualMachine resources via this UI is not fully supported yet.
                    Structure:
                </Typography>
                <pre>
                    {JSON.stringify(record, null, 2)}
                </pre>
            </Box>
        </Edit>
    );
};
