import { Edit } from "@refinedev/mui";
import { Box, TextField, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

export const UserDefinedNetworkEdit = () => {
    const {
        saveButtonProps,
        register,
        formState: { errors },
        refineCore: { queryResult }
    } = useForm({} as any);

    // Note: In a real scenario, editing a UDN might be restricted or require complex handling.
    // For this prototype, we'll just allow viewing/editing basic fields but acknowledge that 
    // changing network topology or subnets on active networks is complex.
    // We will bind to the raw structure for now.

    const userData = queryResult?.data?.data;

    return (
        <Edit saveButtonProps={saveButtonProps}>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                autoComplete="off"
            >
                <TextField
                    {...register("metadata.name", {
                        required: "This field is required",
                    })}
                    error={!!(errors as any)?.metadata?.name}
                    helperText={(errors as any)?.metadata?.name?.message as string}
                    margin="normal"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    type="text"
                    label="Name"
                    name="metadata.name"
                    disabled // Name usually immutable
                />

                {/* Simplified edit view - mostly read-only or limited fields in real k8s */}
                <Typography variant="body2" color="text.secondary">
                    Network Type: {userData?.spec?.layer2 ? "Layer 2 (Secondary)" : userData?.spec?.layer3 ? "Layer 3 (Primary)" : "Unknown"}
                </Typography>

                {/* We just show the JSON for now or specific fields if editable */}
                <Typography variant="body2" color="text.secondary">
                    Editing network configurations directly on Kubernetes resources usually requires care.
                </Typography>
            </Box>
        </Edit>
    );
};
