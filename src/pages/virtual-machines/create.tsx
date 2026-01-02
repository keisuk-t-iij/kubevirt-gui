import { Create } from "@refinedev/mui";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Typography, Divider } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";

interface VirtualMachineFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    instancetype: string;
    networkPattern: "Default" | "DefaultSecondary" | "Primary" | "PrimarySecondary";
    secondaryNetworkName?: string;
    containerDiskImage: string;
    containerDiskName: string;
}

export const VirtualMachineCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        formState: { errors },
        handleSubmit,
        watch
    } = useForm<VirtualMachineFormValues, any, VirtualMachineFormValues>();

    const networkPattern = watch("networkPattern", "Default");

    const onFinishHandler = (data: VirtualMachineFormValues) => {
        const resource: any = {
            apiVersion: "kubevirt.io/v1",
            kind: "VirtualMachine",
            metadata: {
                name: data.metadata.name,
                namespace: data.metadata.namespace
            },
            spec: {
                instancetype: {
                    name: data.instancetype
                },
                runStrategy: "Always",
                template: {
                    spec: {
                        domain: {
                            devices: {
                                interfaces: [],
                                // disks omitted for containerDisk as per design
                            },
                            resources: {} // Empty as per design
                        },
                        networks: [],
                        volumes: []
                    }
                }
            }
        };

        // Network Configuration
        const interfaces = [];
        const networks = [];

        if (data.networkPattern === "Default") {
            interfaces.push({ name: "default", masquerade: {} });
            networks.push({ name: "default", pod: {} });
        } else if (data.networkPattern === "DefaultSecondary") {
            interfaces.push({ name: "default", masquerade: {} });
            interfaces.push({ name: "secondary", bridge: {} });
            networks.push({ name: "default", pod: {} });
            networks.push({
                name: "secondary",
                multus: { networkName: data.secondaryNetworkName }
            });
        } else if (data.networkPattern === "Primary") {
            interfaces.push({ name: "primary", masquerade: {} });
            networks.push({ name: "primary", pod: {} });
        } else if (data.networkPattern === "PrimarySecondary") {
            interfaces.push({ name: "default", masquerade: {} }); // Note: Design uses 'default' here
            interfaces.push({ name: "secondary", bridge: {} });
            networks.push({ name: "default", pod: {} });
            networks.push({
                name: "secondary",
                multus: { networkName: data.secondaryNetworkName }
            });
        }

        resource.spec.template.spec.domain.devices.interfaces = interfaces;
        resource.spec.template.spec.networks = networks;

        // Volume Configuration
        const volumes = [{
            name: data.containerDiskName,
            containerDisk: {
                image: data.containerDiskImage
            }
        }];
        resource.spec.template.spec.volumes = volumes;

        // Note: Disks are omitted in design for containerDisk, so we don't add them.

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
                    {...register("metadata.namespace", { required: "Namespace is required" })}
                    error={!!errors.metadata?.namespace}
                    helperText={errors.metadata?.namespace?.message as string}
                    label="Namespace"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    {...register("instancetype", { required: "Instance Type is required" })}
                    error={!!errors.instancetype}
                    helperText={errors.instancetype?.message as string}
                    label="Instance Type (e.g. u1.small)"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />

                <Divider />
                <Typography variant="h6">Network Configuration</Typography>

                <FormControl fullWidth>
                    <InputLabel id="network-pattern-label">Network Configuration Pattern</InputLabel>
                    <Select
                        labelId="network-pattern-label"
                        {...register("networkPattern", { required: true })}
                        defaultValue="Default"
                        label="Network Configuration Pattern"
                    >
                        <MenuItem value="Default">Default Network</MenuItem>
                        <MenuItem value="DefaultSecondary">Default + Secondary Network</MenuItem>
                        <MenuItem value="Primary">Primary Network (Replace Default)</MenuItem>
                        <MenuItem value="PrimarySecondary">Primary + Secondary Network</MenuItem>
                    </Select>
                </FormControl>

                {(networkPattern === "DefaultSecondary" || networkPattern === "PrimarySecondary") && (
                    <TextField
                        {...register("secondaryNetworkName", { required: "Secondary Network Name is required for this pattern" })}
                        error={!!errors.secondaryNetworkName}
                        helperText={errors.secondaryNetworkName?.message as string}
                        label="Secondary UserDefinedNetwork Name (namespace/name)"
                        placeholder="namespace/name"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                )}

                <Divider />
                <Typography variant="h6">Volume Configuration (ContainerDisk)</Typography>

                <TextField
                    {...register("containerDiskName", { required: "Volume Name is required" })}
                    error={!!errors.containerDiskName}
                    helperText={errors.containerDiskName?.message as string}
                    label="Volume Name"
                    defaultValue="containerdisk-0"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    {...register("containerDiskImage", { required: "Container Image is required" })}
                    error={!!errors.containerDiskImage}
                    helperText={errors.containerDiskImage?.message as string}
                    label="Container Image"
                    placeholder="e.g. quay.io/containerdisks/rocky:9"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                />

            </Box>
        </Create>
    );
};
