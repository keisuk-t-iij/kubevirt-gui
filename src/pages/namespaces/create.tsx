import { Create } from "@refinedev/mui";
import { Box, TextField, Checkbox, FormControlLabel, Typography, Alert } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

interface NamespaceFormValues {
    metadata: {
        name: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    };
    isPrimaryNetwork: boolean;
    isDefaultNamespace: boolean;
}

export const NamespaceCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        formState: { errors },
        handleSubmit
    } = useForm<NamespaceFormValues, any, NamespaceFormValues>({
        defaultValues: {
            isPrimaryNetwork: false,
            isDefaultNamespace: false
        }
    });

    const onFinishHandler = (data: NamespaceFormValues) => {
        const resource: any = {
            apiVersion: "v1",
            kind: "Namespace",
            metadata: {
                name: data.metadata.name,
                labels: {},
                annotations: {}
            }
        };

        if (data.isPrimaryNetwork) {
            resource.metadata.labels["openstack.org/primary-network"] = "true";
        }

        if (data.isDefaultNamespace) {
            resource.metadata.annotations["kubevirt-gui/default-namespace"] = "true";
        }

        onFinish(resource);
    };

    return (
        <Create saveButtonProps={{ onClick: handleSubmit(onFinishHandler) }}>
            <Box
                component="form"
                sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                autoComplete="off"
            >
                <Typography variant="h6">Basic Information</Typography>
                <TextField
                    {...register("metadata.name", { required: "Name is required" })}
                    error={!!errors.metadata?.name}
                    helperText={errors.metadata?.name?.message as string}
                    label="Name"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />

                <FormControlLabel
                    control={<Checkbox {...register("isPrimaryNetwork")} />}
                    label="Use Primary Network (openstack.org/primary-network=true)"
                />

                <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                    <FormControlLabel
                        control={<Checkbox {...register("isDefaultNamespace")} />}
                        label={
                            <Typography fontWeight="bold">
                                Set as Default Namespace
                            </Typography>
                        }
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                        If checked, this namespace will be the default for new resources (VMs, DataVolumes, UDNs).
                        Only one namespace can be default; checking this will unset other namespaces.
                    </Typography>
                </Box>
            </Box>
        </Create>
    );
};
