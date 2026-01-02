import { Create } from "@refinedev/mui";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Typography, Divider } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

interface DataVolumeFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    storage: string;
    sourceType: "http" | "pvc";
    httpUrl?: string;
    pvcName?: string;
}

export const DataVolumeCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        formState: { errors },
        watch,
        handleSubmit
    } = useForm<DataVolumeFormValues, any, DataVolumeFormValues>({
        defaultValues: {
            sourceType: "http",
            storage: "40Gi"
        }
    });

    const sourceType = watch("sourceType", "http");

    const onFinishHandler = (data: DataVolumeFormValues) => {
        const resource: any = {
            apiVersion: "cdi.kubevirt.io/v1beta1",
            kind: "DataVolume",
            metadata: {
                name: data.metadata.name,
                namespace: data.metadata.namespace || "default"
            },
            spec: {
                pvc: {
                    accessModes: ["ReadWriteOnce"],
                    resources: {
                        requests: {
                            storage: data.storage
                        }
                    }
                },
                source: {}
            }
        };

        if (data.sourceType === "http") {
            resource.spec.source.http = { url: data.httpUrl };
        } else if (data.sourceType === "pvc") {
            resource.spec.source.pvc = { name: data.pvcName };
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
                <TextField
                    {...register("metadata.namespace")}
                    label="Namespace"
                    defaultValue="default"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    helperText="Defaults to 'default' if empty"
                />

                <TextField
                    {...register("storage", { required: "Storage size is required" })}
                    error={!!errors.storage}
                    helperText={errors.storage?.message as string}
                    label="Storage Size"
                    placeholder="e.g. 10Gi"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />

                <Divider />
                <Typography variant="h6">Source Configuration</Typography>

                <FormControl fullWidth>
                    <InputLabel id="source-type-label">Source Type</InputLabel>
                    <Select
                        labelId="source-type-label"
                        {...register("sourceType", { required: true })}
                        defaultValue="http"
                        label="Source Type"
                    >
                        <MenuItem value="http">HTTP (URL)</MenuItem>
                        <MenuItem value="pvc">PVC (Existing PVC)</MenuItem>
                    </Select>
                </FormControl>

                {sourceType === "http" && (
                    <TextField
                        {...register("httpUrl", { required: "HTTP URL is required for HTTP source" })}
                        error={!!errors.httpUrl}
                        helperText={errors.httpUrl?.message as string}
                        label="HTTP URL"
                        placeholder="http://example.com/image.qcow2"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                )}

                {sourceType === "pvc" && (
                    <TextField
                        {...register("pvcName", { required: "PVC Name is required for PVC source" })}
                        error={!!errors.pvcName}
                        helperText={errors.pvcName?.message as string}
                        label="PVC Name"
                        placeholder="existing-pvc-name"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                )}

            </Box>
        </Create>
    );
};
