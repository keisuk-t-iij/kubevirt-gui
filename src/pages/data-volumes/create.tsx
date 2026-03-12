import { Create } from "@refinedev/mui";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Typography, Divider, FormHelperText } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useSelect } from "@refinedev/core";
import { useEffect } from "react";

const HTTP_ENVIRONMENT_HOSTS = {
    "sri-b": "ike-minio1800.hop.2iij.net",
    "mte-c": "ike-minio1100.hop.2iij.net",
    "sri-dev": "ike-minio4500.thop.2iij.net",
} as const;

const HTTP_TEMPLATE_PATHS = [
    "/common-templates/sre-ubuntu2204-20260202-template.qcow2",
    "/common-templates/sre-rocky9-20260202-template.qcow2",
    "/common-templates/sre-stubl9-int-20260306-template.qcow2",
    "/common-templates/sre-ubuntu2204-debug-20260202-template.qcow2",
] as const;

const buildHttpUrl = (
    environment: keyof typeof HTTP_ENVIRONMENT_HOSTS,
    templatePath: string,
) => `https://${HTTP_ENVIRONMENT_HOSTS[environment]}${templatePath}`;

const getTemplateFileName = (templatePath: string) => {
    return templatePath.split("/").pop() ?? templatePath;
};

interface DataVolumeFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    storage: string;
    sourceType: "http" | "pvc";
    httpEnvironment?: keyof typeof HTTP_ENVIRONMENT_HOSTS;
    httpTemplatePath?: string;
    pvcName?: string;
}

export const DataVolumeCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        formState: { errors },
        watch,
        handleSubmit,
        setValue
    } = useForm<DataVolumeFormValues, any, DataVolumeFormValues>({
        defaultValues: {
            metadata: {
                namespace: "default"
            },
            sourceType: "http",
            storage: "40Gi",
            httpEnvironment: "sri-dev",
            httpTemplatePath: HTTP_TEMPLATE_PATHS[0]
        }
    });

    const sourceType = watch("sourceType", "http");
    const currentNamespace = watch("metadata.namespace");
    const currentHttpEnvironment = watch("httpEnvironment", "sri-dev");
    const currentHttpTemplatePath = watch("httpTemplatePath", HTTP_TEMPLATE_PATHS[0]);

    const { options: dataVolumeOptions } = useSelect({
        resource: "data_volumes",
        optionLabel: "metadata.name",
        optionValue: "metadata.name",
    });

    const { query } = useSelect({
        resource: "namespaces",
        pagination: { mode: "off" }
    });
    const namespaceData = query?.data;

    const defaultNamespaceInfo = namespaceData?.data?.find((ns: any) => ns.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true");

    useEffect(() => {
        if (defaultNamespaceInfo?.metadata?.name) {
            setValue("metadata.namespace", defaultNamespaceInfo.metadata.name);
        }
    }, [defaultNamespaceInfo, setValue]);

    const onFinishHandler = (data: DataVolumeFormValues) => {
        const resource: any = {
            apiVersion: "cdi.kubevirt.io/v1beta1",
            kind: "DataVolume",
            metadata: {
                name: data.metadata.name,
                namespace: data.metadata.namespace || "default"
            },
            spec: {
                source: {}
            }
        };

        if (data.sourceType === "http") {
            resource.spec.pvc = {
                accessModes: ["ReadWriteMany"],
                resources: {
                    requests: {
                        storage: data.storage
                    }
                }
            }
            resource.spec.source.http = {
                url: buildHttpUrl(
                    data.httpEnvironment ?? "sri-dev",
                    data.httpTemplatePath ?? HTTP_TEMPLATE_PATHS[0],
                )
            };
        } else if (data.sourceType === "pvc") {
            resource.spec.source.pvc = { name: data.pvcName, namespace: data.metadata.namespace };
            resource.spec.storage = { accessModes: ["ReadWriteMany"], resources: { requests: { storage: data.storage } } }
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
                <FormControl fullWidth>
                    <InputLabel id="namespace-label">Namespace</InputLabel>
                    <Select
                        labelId="namespace-label"
                        {...register("metadata.namespace")}
                        label="Namespace"
                        value={currentNamespace || ""}
                    >
                        {query?.data?.data.map((item: any) => (
                            <MenuItem key={item.id} value={item.metadata.name}>
                                {item.metadata.name}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>Defaults to 'default' if empty</FormHelperText>
                </FormControl>

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
                        <MenuItem value="pvc">PVC (Existing DataVolume)</MenuItem>
                    </Select>
                </FormControl>

                {sourceType === "http" && (
                    <>
                        <FormControl fullWidth>
                            <InputLabel id="http-environment-label">Environment</InputLabel>
                            <Select
                                labelId="http-environment-label"
                                {...register("httpEnvironment", { required: "Environment is required" })}
                                label="Environment"
                                value={currentHttpEnvironment || "sri-dev"}
                                error={!!errors.httpEnvironment}
                            >
                                <MenuItem value="sri-b">sri-b</MenuItem>
                                <MenuItem value="mte-c">mte-c</MenuItem>
                                <MenuItem value="sri-dev">sri-dev</MenuItem>
                            </Select>
                            {errors.httpEnvironment && (
                                <FormHelperText error>{errors.httpEnvironment.message as string}</FormHelperText>
                            )}
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel id="http-url-label">HTTP URL</InputLabel>
                            <Select
                                labelId="http-url-label"
                                {...register("httpTemplatePath", { required: "HTTP URL is required for HTTP source" })}
                                label="HTTP URL"
                                value={currentHttpTemplatePath || HTTP_TEMPLATE_PATHS[0]}
                                error={!!errors.httpTemplatePath}
                            >
                                {HTTP_TEMPLATE_PATHS.map((templatePath) => (
                                    <MenuItem key={templatePath} value={templatePath}>
                                        {getTemplateFileName(templatePath)}
                                    </MenuItem>
                                ))}
                            </Select>
                            <FormHelperText>
                                {buildHttpUrl(currentHttpEnvironment || "sri-dev", currentHttpTemplatePath || HTTP_TEMPLATE_PATHS[0])}
                            </FormHelperText>
                            {errors.httpTemplatePath && (
                                <FormHelperText error>{errors.httpTemplatePath.message as string}</FormHelperText>
                            )}
                        </FormControl>
                    </>
                )}

                {sourceType === "pvc" && (
                    <FormControl fullWidth>
                        <InputLabel id="pvc-select-label">Select Source DataVolume</InputLabel>
                        <Select
                            labelId="pvc-select-label"
                            {...register("pvcName", { required: "Source DataVolume is required" })}
                            label="Select Source DataVolume"
                            defaultValue=""
                            error={!!errors.pvcName}
                        >
                            {dataVolumeOptions.map((option: any) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                        {errors.pvcName && (
                            <FormHelperText error>{errors.pvcName.message as string}</FormHelperText>
                        )}
                    </FormControl>
                )}

            </Box>
        </Create>
    );
};
