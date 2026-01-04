import { Create } from "@refinedev/mui";
import { useSelect, useList } from "@refinedev/core";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Typography, Divider, Button, IconButton, Stack, FormHelperText } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray } from "react-hook-form";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useEffect } from "react";

interface VirtualMachineFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    instancetype: string;
    networkPattern: "Default" | "DefaultSecondary" | "Primary" | "PrimarySecondary";
    secondaryNetworks?: { name: string }[];
    // Volume Configuration (OS)
    volumeType: "containerDisk" | "dataVolume";
    // ContainerDisk fields
    containerDiskImage?: string;
    containerDiskName?: string;
    // DataVolume fields
    dataVolumeName?: string;
    dataVolumeVolumeName?: string;
    // Additional Data Volumes
    additionalVolumes?: {
        name: string;
        type: "cloudInitNoCloud" | "persistentVolumeClaim" | "configMap" | "secret";
        // cloudInitNoCloud fields
        cloudInitUserData?: string;
        cloudInitNetworkData?: string;
        // persistentVolumeClaim fields
        pvcClaimName?: string;
        // configMap fields
        configMapName?: string;
        // secret fields
        secretName?: string;
    }[];
}

export const VirtualMachineCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        control,
        formState: { errors },
        handleSubmit,
        watch,
        setValue
    } = useForm<VirtualMachineFormValues, any, VirtualMachineFormValues>({
        defaultValues: {
            networkPattern: "Default",
            secondaryNetworks: [{ name: "" }],
            volumeType: "containerDisk",
            additionalVolumes: []
        }
    });

    const { fields: secondaryNetworkFields, append: appendSecondaryNetwork, remove: removeSecondaryNetwork } = useFieldArray({
        control,
        name: "secondaryNetworks"
    });

    const { fields: additionalVolumeFields, append: appendAdditionalVolume, remove: removeAdditionalVolume } = useFieldArray({
        control,
        name: "additionalVolumes"
    });

    // Fetch Namespaces to find the default one
    // Fetch Namespaces to find the default one
    const { query } = useSelect({
        resource: "namespaces",
        pagination: { mode: "off" }
    });
    const namespaceData = query?.data;

    const defaultNamespaceInfo = namespaceData?.data?.find((ns: any) => ns.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true");

    useEffect(() => {
        if (defaultNamespaceInfo) {
            // Only set if user hasn't typed anything - but here we assume initial load
            // Or better, just set it if the field is empty or 'default'
            // Since useForm defaultValues are set once, we use setValue here
            // But wait, useForm's defaultValue 'default' is already there. 
            // We should override it if a specific default namespace is configured.
            if (defaultNamespaceInfo.metadata?.name) {
                // For now, let's force set it if it exists
                // Actually, useForm might need reset() if we want to change defaults cleanly, or setValue
                // Let's use setValue but check if dirty?
                // Simple approach: just setValue("metadata.namespace", name)
                // But we need setValue from useForm
                setValue("metadata.namespace", defaultNamespaceInfo.metadata.name);
            }
        }
    }, [defaultNamespaceInfo]); // Add setValue to dependency in real code

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
    const additionalVolumes = watch("additionalVolumes");

    const onFinishHandler = (data: VirtualMachineFormValues) => {
        const resource: any = {
            apiVersion: "kubevirt.io/v1",
            kind: "VirtualMachine",
            metadata: {
                name: data.metadata.name,
                namespace: data.metadata.namespace,
                annotations: {
                    "kubevirt-gui/network-pattern": data.networkPattern
                }
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
                                disks: [],
                            },
                            resources: {}
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
        const disks = [];

        // 1. OS Volume
        if (data.volumeType === "containerDisk") {
            const volName = data.containerDiskName || "os-volume";
            volumes.push({
                name: volName,
                containerDisk: {
                    image: data.containerDiskImage
                }
            });
            disks.push({
                name: volName,
                disk: { bus: "virtio" }
            });
        } else if (data.volumeType === "dataVolume") {
            const volName = data.dataVolumeVolumeName || "os-volume";
            volumes.push({
                name: volName,
                dataVolume: {
                    name: data.dataVolumeName
                }
            });
            disks.push({
                name: volName,
                disk: { bus: "virtio" }
            });
        }

        // 2. Additional Volumes
        if (data.additionalVolumes) {
            data.additionalVolumes.forEach((vol) => {
                const volConfig: any = { name: vol.name };

                if (vol.type === "cloudInitNoCloud") {
                    volConfig.cloudInitNoCloud = {};
                    if (vol.cloudInitUserData && vol.cloudInitUserData.trim() !== "") {
                        volConfig.cloudInitNoCloud.userDataBase64 = btoa(vol.cloudInitUserData);
                    }
                    if (vol.cloudInitNetworkData && vol.cloudInitNetworkData.trim() !== "") {
                        volConfig.cloudInitNoCloud.networkDataBase64 = btoa(vol.cloudInitNetworkData);
                    }
                } else if (vol.type === "persistentVolumeClaim") {
                    volConfig.persistentVolumeClaim = {
                        claimName: vol.pvcClaimName
                    };
                } else if (vol.type === "configMap") {
                    volConfig.configMap = {
                        name: vol.configMapName
                    };
                } else if (vol.type === "secret") {
                    volConfig.secret = {
                        secretName: vol.secretName
                    };
                }

                volumes.push(volConfig);
                disks.push({
                    name: vol.name,
                    disk: { bus: "virtio" }
                });
            });
        }

        resource.spec.template.spec.volumes = volumes;
        resource.spec.template.spec.domain.devices.disks = disks;

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
                        {...register("metadata.namespace", { required: "Namespace is required" })}
                        label="Namespace"
                        defaultValue=""
                        error={!!errors.metadata?.namespace}
                    >
                        {query?.data?.data.map((item: any) => (
                            <MenuItem key={item.id} value={item.metadata.name}>
                                {item.metadata.name}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.metadata?.namespace && (
                        <FormHelperText error>{errors.metadata?.namespace.message as string}</FormHelperText>
                    )}
                </FormControl>

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
                        {secondaryNetworkFields.map((field: any, index: number) => (
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
                                <IconButton onClick={() => removeSecondaryNetwork(index)} disabled={secondaryNetworkFields.length === 1} color="error">
                                    <DeleteIcon />
                                </IconButton>
                            </Stack>
                        ))}
                        <Button
                            startIcon={<AddIcon />}
                            onClick={() => appendSecondaryNetwork({ name: "" })}
                            variant="outlined"
                        >
                            Add Secondary Network
                        </Button>
                    </Box>
                )}

                <Divider />
                <Typography variant="h6">OS Volume Configuration</Typography>

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
                            defaultValue="os-volume"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                        <FormControl fullWidth>
                            <InputLabel id="container-image-label">Container Image</InputLabel>
                            <Select
                                labelId="container-image-label"
                                {...register("containerDiskImage", { required: "Container Image is required" })}
                                label="Container Image"
                                defaultValue="ikr.iij.jp/virt/rocky-int:9"
                                error={!!errors.containerDiskImage}
                            >
                                <MenuItem value="ikr.iij.jp/virt/rocky-int:9">ikr.iij.jp/virt/rocky-int:9</MenuItem>
                                <MenuItem value="ikr.iij.jp/virt/ubuntu-int:22.04">ikr.iij.jp/virt/ubuntu-int:22.04</MenuItem>
                                <MenuItem value="ikr.iij.jp/virt/ubuntu-debug-int:22.04">ikr.iij.jp/virt/ubuntu-debug-int:22.04</MenuItem>
                            </Select>
                            {errors.containerDiskImage && (
                                <FormHelperText error>{errors.containerDiskImage.message as string}</FormHelperText>
                            )}
                        </FormControl>
                    </Box>
                )}

                {volumeType === "dataVolume" && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                        <TextField
                            {...register("dataVolumeVolumeName", { required: "Volume Name is required" })}
                            error={!!errors.dataVolumeVolumeName}
                            helperText={errors.dataVolumeVolumeName?.message as string}
                            label="Volume Name"
                            defaultValue="os-volume"
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

                <Divider />
                <Typography variant="h6">Additional Data Volumes</Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                    {additionalVolumeFields.map((field: any, index: number) => (
                        <Box key={field.id} sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1, position: 'relative' }}>
                            <IconButton
                                onClick={() => removeAdditionalVolume(index)}
                                color="error"
                                sx={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                <DeleteIcon />
                            </IconButton>
                            <Stack spacing={2}>
                                <Typography variant="subtitle2">Volume {index + 1}</Typography>
                                <TextField
                                    {...register(`additionalVolumes.${index}.name`, { required: "Volume Name is required" })}
                                    label="Volume Name"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Volume Type</InputLabel>
                                    <Select
                                        {...register(`additionalVolumes.${index}.type`, { required: "Type is required" })}
                                        defaultValue="persistentVolumeClaim"
                                        label="Volume Type"
                                    >
                                        <MenuItem value="cloudInitNoCloud">cloudInitNoCloud</MenuItem>
                                        <MenuItem value="persistentVolumeClaim">persistentVolumeClaim</MenuItem>
                                        <MenuItem value="configMap">configMap</MenuItem>
                                        <MenuItem value="secret">secret</MenuItem>
                                    </Select>
                                </FormControl>

                                {additionalVolumes && additionalVolumes[index]?.type === "cloudInitNoCloud" && (
                                    <>
                                        <TextField
                                            {...register(`additionalVolumes.${index}.cloudInitUserData`)}
                                            label="User Data (Plain Text)"
                                            fullWidth
                                            multiline
                                            rows={5}
                                            InputLabelProps={{ shrink: true }}
                                            defaultValue={`#cloud-config
write_files:
  - content: AllowGroups \${SERVICE_GROUP}
    path: /etc/ssh/sshd_config
    append: true`}
                                        />
                                        <TextField
                                            {...register(`additionalVolumes.${index}.cloudInitNetworkData`)}
                                            label="Network Data (Plain Text)"
                                            fullWidth
                                            multiline
                                            rows={2}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </>
                                )}

                                {additionalVolumes && additionalVolumes[index]?.type === "persistentVolumeClaim" && (
                                    <TextField
                                        {...register(`additionalVolumes.${index}.pvcClaimName`, { required: "Claim Name is required" })}
                                        label="Claim Name"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}

                                {additionalVolumes && additionalVolumes[index]?.type === "configMap" && (
                                    <TextField
                                        {...register(`additionalVolumes.${index}.configMapName`, { required: "ConfigMap Name is required" })}
                                        label="ConfigMap Name"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}

                                {additionalVolumes && additionalVolumes[index]?.type === "secret" && (
                                    <TextField
                                        {...register(`additionalVolumes.${index}.secretName`, { required: "Secret Name is required" })}
                                        label="Secret Name"
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                    />
                                )}
                            </Stack>
                        </Box>
                    ))}
                    <Button
                        startIcon={<AddIcon />}
                        onClick={() => appendAdditionalVolume({ name: "", type: "persistentVolumeClaim" })}
                        variant="outlined"
                    >
                        Add Data Volume
                    </Button>
                </Box>

            </Box>
        </Create>
    );
};
