import { Create } from "@refinedev/mui";
import { useSelect } from "@refinedev/core";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Typography, Divider, Button, IconButton, Stack, FormHelperText } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray } from "react-hook-form";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

interface VirtualMachineFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    instancetype: string;
    networkPattern: "Default" | "DefaultSecondary" | "Primary" | "PrimarySecondary";
    secondaryNetworks?: { name: string }[];
    // Volume Configuration
    volumeType: "containerDisk" | "dataVolume";
    // ContainerDisk fields
    containerDiskImage?: string;
    containerDiskName?: string;
    // DataVolume fields
    dataVolumeName?: string;
    dataVolumeVolumeName?: string; // The name of the volume in VM spec
}

export const VirtualMachineCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        control,
        formState: { errors },
        handleSubmit,
        watch
    } = useForm<VirtualMachineFormValues, any, VirtualMachineFormValues>({
        defaultValues: {
            networkPattern: "Default",
            secondaryNetworks: [{ name: "" }],
            volumeType: "containerDisk"
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "secondaryNetworks"
    });

    const { options: instanceTypeOptions } = useSelect({
        resource: "virtual_machine_cluster_instancetypes",
        optionLabel: "metadata.name",
        optionValue: "metadata.name",
    });

    const { options: udnOptions } = useSelect({
        resource: "user_defined_networks",
        optionLabel: "metadata.name",
        optionValue: "metadata.name",
    });

    const { options: dataVolumeOptions } = useSelect({
        resource: "data_volumes",
        optionLabel: "metadata.name",
        optionValue: "metadata.name",
    });

    const networkPattern = watch("networkPattern", "Default");
    const volumeType = watch("volumeType", "containerDisk");

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

        // Helper to add secondary networks
        const addSecondaryNetworks = () => {
            if (data.secondaryNetworks && data.secondaryNetworks.length > 0) {
                data.secondaryNetworks.forEach((net, index) => {
                    const ifaceName = `secondary-${index}`;
                    interfaces.push({ name: ifaceName, bridge: {} });
                    networks.push({
                        name: ifaceName,
                        multus: { networkName: net.name }
                    });
                });
            }
        };

        if (data.networkPattern === "Default") {
            interfaces.push({ name: "default", masquerade: {} });
            networks.push({ name: "default", pod: {} });
        } else if (data.networkPattern === "DefaultSecondary") {
            interfaces.push({ name: "default", masquerade: {} });
            networks.push({ name: "default", pod: {} });
            addSecondaryNetworks();
        } else if (data.networkPattern === "Primary") {
            interfaces.push({ name: "primary", masquerade: {} });
            networks.push({ name: "primary", pod: {} });
        } else if (data.networkPattern === "PrimarySecondary") {
            interfaces.push({ name: "default", masquerade: {} }); // Note: Design uses 'default' here for Primary
            networks.push({ name: "default", pod: {} });
            addSecondaryNetworks();
        }

        resource.spec.template.spec.domain.devices.interfaces = interfaces;
        resource.spec.template.spec.networks = networks;

        // Volume Configuration
        const volumes = [];
        if (data.volumeType === "containerDisk") {
            volumes.push({
                name: data.containerDiskName || "containerdisk-0",
                containerDisk: {
                    image: data.containerDiskImage
                }
            });
        } else if (data.volumeType === "dataVolume") {
            volumes.push({
                name: data.dataVolumeVolumeName || "datavolume-0",
                dataVolume: {
                    name: data.dataVolumeName
                }
            });
        }

        resource.spec.template.spec.volumes = volumes;

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

                <FormControl fullWidth>
                    <InputLabel id="instancetype-label">Instance Type</InputLabel>
                    <Select
                        labelId="instancetype-label"
                        {...register("instancetype", { required: "Instance Type is required" })}
                        label="Instance Type"
                        defaultValue=""
                    >
                        {instanceTypeOptions.map((option: any) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.instancetype && (
                        <FormHelperText error>{errors.instancetype.message as string}</FormHelperText>
                    )}
                </FormControl>

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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1">Secondary Networks</Typography>
                        {fields.map((field: any, index: number) => (
                            <Stack key={field.id} direction="row" spacing={2} alignItems="center">
                                <FormControl fullWidth>
                                    <InputLabel id={`secondary-network-label-${index}`}>Secondary Network {index + 1}</InputLabel>
                                    <Select
                                        labelId={`secondary-network-label-${index}`}
                                        {...register(`secondaryNetworks.${index}.name`, { required: "Secondary Network Name is required" })}
                                        label={`Secondary Network ${index + 1}`}
                                        defaultValue=""
                                    >
                                        {udnOptions.map((option: any) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <IconButton onClick={() => remove(index)} disabled={fields.length === 1} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => append({ name: "" })}
                            variant="outlined"
                        >
                            Add Secondary Network
                        </Button>
                    </Box>
                )}

                <Divider />
                <Typography variant="h6">Volume Configuration</Typography>

                <FormControl fullWidth>
                    <InputLabel id="volume-type-label">Volume Type</InputLabel>
                    <Select
                        labelId="volume-type-label"
                        {...register("volumeType", { required: true })}
                        defaultValue="containerDisk"
                        label="Volume Type"
                    >
                        <MenuItem value="containerDisk">Container Disk</MenuItem>
                        <MenuItem value="dataVolume">Data Volume</MenuItem>
                    </Select>
                </FormControl>

                {volumeType === "containerDisk" && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
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
                )}

                {volumeType === "dataVolume" && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                        <TextField
                            {...register("dataVolumeVolumeName", { required: "Volume Name is required" })}
                            error={!!errors.dataVolumeVolumeName}
                            helperText={errors.dataVolumeVolumeName?.message as string}
                            label="Volume Name"
                            defaultValue="datavolume-0"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControl fullWidth>
                            <InputLabel id="datavolume-select-label">Select Data Volume</InputLabel>
                            <Select
                                labelId="datavolume-select-label"
                                {...register("dataVolumeName", { required: "Data Volume is required" })}
                                label="Select Data Volume"
                                defaultValue=""
                                error={!!errors.dataVolumeName}
                            >
                                {dataVolumeOptions.map((option: any) => (
                                    <MenuItem key={option.value} value={option.value}>
                                        {option.label}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.dataVolumeName && (
                                <FormHelperText error>{errors.dataVolumeName.message as string}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>
                )}

            </Box>
        </Create>
    );
};
