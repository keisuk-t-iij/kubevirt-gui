import { Edit } from "@refinedev/mui";
import { Box, TextField, Checkbox, FormControlLabel, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useEffect } from "react";

interface NamespaceFormValues {
    metadata: {
        name: string;
        labels?: Record<string, string>;
        annotations?: Record<string, string>;
    };
    isPrimaryNetwork: boolean;
    isDefaultNamespace: boolean;
}

export const NamespaceEdit = () => {
    const {
        saveButtonProps,
        refineCore: { query, onFinish },
        register,
        formState: { errors },
        handleSubmit,
        setValue
    } = useForm<NamespaceFormValues, any, NamespaceFormValues>();

    const record = query?.data?.data;

    useEffect(() => {
        if (record) {
            const isPrimary = record.metadata?.labels?.["k8s.ovn.org/primary-user-defined-network"] === "true";
            const isDefault = record.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true";
            setValue("isPrimaryNetwork", isPrimary);
            setValue("isDefaultNamespace", isDefault);
        }
    }, [record, setValue]);

    const onFinishHandler = (data: NamespaceFormValues) => {
        if (!record) return;
        const resource: any = {
            ...record,
            metadata: {
                ...record.metadata,
                labels: { ...record.metadata.labels },
                annotations: { ...record.metadata.annotations }
            }
        };

        if (data.isPrimaryNetwork) {
            resource.metadata.labels["k8s.ovn.org/primary-user-defined-network"] = "true";
        } else {
            delete resource.metadata.labels["k8s.ovn.org/primary-user-defined-network"];
        }

        if (data.isDefaultNamespace) {
            resource.metadata.annotations["kubevirt-gui/default-namespace"] = "true";
        } else {
            delete resource.metadata.annotations["kubevirt-gui/default-namespace"];
        }

        onFinish(resource);
    };

    return (
        <Edit saveButtonProps={{ onClick: handleSubmit(onFinishHandler) }}>
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
                    disabled // Name is usually immutable
                />

                <FormControlLabel
                    control={<Checkbox {...register("isPrimaryNetwork")} defaultChecked={record?.metadata?.labels?.["k8s.ovn.org/primary-user-defined-network"] === "true"} />}
                    label="Use Primary Network"
                />

                <Box sx={{ border: '1px solid #ddd', p: 2, borderRadius: 1 }}>
                    <FormControlLabel
                        control={<Checkbox {...register("isDefaultNamespace")} defaultChecked={record?.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true"} />}
                        label={
                            <Typography fontWeight="bold">
                                Set as Default Namespace
                            </Typography>
                        }
                    />
                    <Typography variant="caption" display="block" color="text.secondary">
                        If checked, this namespace will be the default for new resources.
                        Only one namespace can be default.
                    </Typography>
                </Box>
            </Box>
        </Edit>
    );
};
