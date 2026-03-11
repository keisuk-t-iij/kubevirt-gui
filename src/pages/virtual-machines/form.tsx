import { Create, Edit } from "@refinedev/mui";
import { useSelect } from "@refinedev/core";
import {
    Box,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Typography,
    Divider,
    Button,
    IconButton,
    Stack,
    FormHelperText,
} from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useFieldArray, UseFormRegister } from "react-hook-form";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { useEffect } from "react";

export type VirtualMachineVariant = "ike-virtualization" | "ike-virtual-private-cluster";

type NetworkPattern = "Default" | "DefaultSecondary" | "Primary" | "PrimarySecondary";

interface VirtualMachineFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    instancetype: string;
    networkPattern: NetworkPattern;
    secondaryNetworks?: { name: string }[];
    volumeType: "containerDisk" | "dataVolume";
    containerDiskImage?: string;
    containerDiskName?: string;
    dataVolumeName?: string;
    dataVolumeVolumeName?: string;
    additionalVolumes?: {
        name: string;
        type: "cloudInitNoCloud" | "persistentVolumeClaim" | "configMap" | "secret";
        cloudInitUserData?: string;
        cloudInitNetworkData?: string;
        pvcClaimName?: string;
        configMapName?: string;
        secretName?: string;
    }[];
}

const NETWORK_PATTERN_ANNOTATION = "kubevirt-gui/network-pattern";
const VM_VARIANT_ANNOTATION = "kubevirt-gui/vm-variant";

const variantLabelMap: Record<VirtualMachineVariant, string> = {
    "ike-virtualization": "IKE Virtualization",
    "ike-virtual-private-cluster": "IKE Virtual Private Cluster",
};

const decodeBase64 = (value?: string) => {
    if (!value) {
        return "";
    }

    try {
        return atob(value);
    } catch {
        return value;
    }
};

const getNetworkPattern = (record: any): NetworkPattern => {
    const annotatedPattern = record?.metadata?.annotations?.[NETWORK_PATTERN_ANNOTATION];
    if (annotatedPattern) {
        return annotatedPattern;
    }

    const multusNetworks = (record?.spec?.template?.spec?.networks ?? []).filter(
        (network: any) => network.multus?.networkName,
    );

    return multusNetworks.length > 0 ? "DefaultSecondary" : "Default";
};

const getDefaultValues = (): VirtualMachineFormValues => ({
    metadata: {
        name: "",
        namespace: "default",
    },
    instancetype: "",
    networkPattern: "Default",
    secondaryNetworks: [{ name: "" }],
    volumeType: "containerDisk",
    containerDiskName: "os-volume",
    containerDiskImage: "ikr.iij.jp/virt/rocky-int:9",
    dataVolumeVolumeName: "os-volume",
    additionalVolumes: [],
});

const buildValuesFromRecord = (
    record: any,
    variant: VirtualMachineVariant,
): VirtualMachineFormValues => {
    const defaultValues = getDefaultValues();
    const volumes = record?.spec?.template?.spec?.volumes ?? [];
    const networks = record?.spec?.template?.spec?.networks ?? [];
    const secondaryNetworks = networks
        .filter((network: any) => network.multus?.networkName)
        .map((network: any) => ({ name: network.multus.networkName }));

    const osVolume = volumes[0];
    const additionalVolumes = volumes.slice(1).map((volume: any) => {
        if (volume.cloudInitNoCloud) {
            return {
                name: volume.name,
                type: "cloudInitNoCloud" as const,
                cloudInitUserData: decodeBase64(volume.cloudInitNoCloud.userDataBase64),
                cloudInitNetworkData: decodeBase64(volume.cloudInitNoCloud.networkDataBase64),
            };
        }

        if (volume.persistentVolumeClaim) {
            return {
                name: volume.name,
                type: "persistentVolumeClaim" as const,
                pvcClaimName: volume.persistentVolumeClaim.claimName,
            };
        }

        if (volume.configMap) {
            return {
                name: volume.name,
                type: "configMap" as const,
                configMapName: volume.configMap.name,
            };
        }

        return {
            name: volume.name,
            type: "secret" as const,
            secretName: volume.secret?.secretName,
        };
    });

    const values: VirtualMachineFormValues = {
        metadata: {
            name: record?.metadata?.name ?? defaultValues.metadata.name,
            namespace: record?.metadata?.namespace ?? defaultValues.metadata.namespace,
        },
        instancetype: record?.spec?.instancetype?.name ?? defaultValues.instancetype,
        networkPattern:
            variant === "ike-virtualization" ? "Default" : getNetworkPattern(record),
        secondaryNetworks:
            secondaryNetworks.length > 0 ? secondaryNetworks : defaultValues.secondaryNetworks,
        volumeType: defaultValues.volumeType,
        containerDiskName: defaultValues.containerDiskName,
        containerDiskImage: defaultValues.containerDiskImage,
        dataVolumeVolumeName: defaultValues.dataVolumeVolumeName,
        dataVolumeName: "",
        additionalVolumes,
    };

    if (osVolume?.containerDisk) {
        values.volumeType = "containerDisk";
        values.containerDiskName = osVolume.name;
        values.containerDiskImage = osVolume.containerDisk.image;
    } else if (osVolume?.dataVolume) {
        values.volumeType = "dataVolume";
        values.dataVolumeVolumeName = osVolume.name;
        values.dataVolumeName = osVolume.dataVolume.name;
    }

    return values;
};

const buildResource = (
    data: VirtualMachineFormValues,
    variant: VirtualMachineVariant,
    record?: any,
) => {
    const networkPattern: NetworkPattern =
        variant === "ike-virtualization" ? "Default" : data.networkPattern;

    const interfaces: any[] = [];
    const networks: any[] = [];

    const addSecondaryNetworks = () => {
        if (data.secondaryNetworks && data.secondaryNetworks.length > 0) {
            data.secondaryNetworks.forEach((network, index) => {
                if (!network.name) {
                    return;
                }

                const interfaceName = `secondary-${index}`;
                interfaces.push({ name: interfaceName, bridge: {} });
                networks.push({
                    name: interfaceName,
                    multus: { networkName: network.name },
                });
            });
        }
    };

    if (networkPattern === "Default") {
        interfaces.push({ name: "default", masquerade: {} });
        networks.push({ name: "default", pod: {} });
    } else if (networkPattern === "DefaultSecondary") {
        interfaces.push({ name: "default", masquerade: {} });
        networks.push({ name: "default", pod: {} });
        addSecondaryNetworks();
    } else if (networkPattern === "Primary") {
        interfaces.push({ name: "primary", masquerade: {} });
        networks.push({ name: "primary", pod: {} });
    } else if (networkPattern === "PrimarySecondary") {
        interfaces.push({ name: "default", masquerade: {} });
        networks.push({ name: "default", pod: {} });
        addSecondaryNetworks();
    }

    const volumes: any[] = [];
    const disks: any[] = [];

    if (data.volumeType === "containerDisk") {
        const volumeName = data.containerDiskName || "os-volume";
        volumes.push({
            name: volumeName,
            containerDisk: {
                image: data.containerDiskImage,
            },
        });
        disks.push({
            name: volumeName,
            disk: { bus: "virtio" },
        });
    } else {
        const volumeName = data.dataVolumeVolumeName || "os-volume";
        volumes.push({
            name: volumeName,
            dataVolume: {
                name: data.dataVolumeName,
            },
        });
        disks.push({
            name: volumeName,
            disk: { bus: "virtio" },
        });
    }

    data.additionalVolumes?.forEach((volume) => {
        const volumeConfig: any = { name: volume.name };

        if (volume.type === "cloudInitNoCloud") {
            volumeConfig.cloudInitNoCloud = {};
            if (volume.cloudInitUserData?.trim()) {
                volumeConfig.cloudInitNoCloud.userDataBase64 = btoa(volume.cloudInitUserData);
            }
            if (volume.cloudInitNetworkData?.trim()) {
                volumeConfig.cloudInitNoCloud.networkDataBase64 = btoa(volume.cloudInitNetworkData);
            }
        } else if (volume.type === "persistentVolumeClaim") {
            volumeConfig.persistentVolumeClaim = {
                claimName: volume.pvcClaimName,
            };
        } else if (volume.type === "configMap") {
            volumeConfig.configMap = {
                name: volume.configMapName,
            };
        } else if (volume.type === "secret") {
            volumeConfig.secret = {
                secretName: volume.secretName,
            };
        }

        volumes.push(volumeConfig);
        disks.push({
            name: volume.name,
            disk: { bus: "virtio" },
        });
    });

    return {
        ...record,
        apiVersion: "kubevirt.io/v1",
        kind: "VirtualMachine",
        metadata: {
            ...record?.metadata,
            name: data.metadata.name,
            namespace: data.metadata.namespace,
            annotations: {
                ...(record?.metadata?.annotations ?? {}),
                [NETWORK_PATTERN_ANNOTATION]: networkPattern,
                [VM_VARIANT_ANNOTATION]: variant,
            },
        },
        spec: {
            ...(record?.spec ?? {}),
            instancetype: {
                name: data.instancetype,
            },
            runStrategy: record?.spec?.runStrategy ?? "Always",
            template: {
                ...(record?.spec?.template ?? {}),
                spec: {
                    ...(record?.spec?.template?.spec ?? {}),
                    domain: {
                        ...(record?.spec?.template?.spec?.domain ?? {}),
                        devices: {
                            ...(record?.spec?.template?.spec?.domain?.devices ?? {}),
                            interfaces,
                            disks,
                        },
                        resources: record?.spec?.template?.spec?.domain?.resources ?? {},
                    },
                    networks,
                    volumes,
                },
            },
        },
    };
};

const NetworkPatternField = ({
    variant,
    register,
}: {
    variant: VirtualMachineVariant;
    register: UseFormRegister<VirtualMachineFormValues>;
}) => {
    if (variant === "ike-virtualization") {
        return (
            <FormControl fullWidth>
                <InputLabel id="network-pattern-label">Network Configuration Pattern</InputLabel>
                <Select
                    labelId="network-pattern-label"
                    {...register("networkPattern", { required: true })}
                    value="Default"
                    label="Network Configuration Pattern"
                    disabled
                >
                    <MenuItem value="Default">Default Network</MenuItem>
                </Select>
                <FormHelperText>
                    IKE Virtualization では Default Network のみ選択できます。
                </FormHelperText>
            </FormControl>
        );
    }

    return (
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
    );
};

export const VirtualMachineFormPage = ({
    mode,
    variant,
}: {
    mode: "create" | "edit";
    variant: VirtualMachineVariant;
}) => {
    const {
        refineCore: { onFinish, query },
        register,
        control,
        formState: { errors },
        handleSubmit,
        watch,
        setValue,
        reset,
    } = useForm<VirtualMachineFormValues, any, VirtualMachineFormValues>({
        defaultValues: getDefaultValues(),
    });

    const record = query?.data?.data;

    const { fields: secondaryNetworkFields, append: appendSecondaryNetwork, remove: removeSecondaryNetwork } = useFieldArray({
        control,
        name: "secondaryNetworks",
    });

    const { fields: additionalVolumeFields, append: appendAdditionalVolume, remove: removeAdditionalVolume } = useFieldArray({
        control,
        name: "additionalVolumes",
    });

    const { query: namespaceQuery } = useSelect({
        resource: "namespaces",
        pagination: { mode: "off" },
    });

    const defaultNamespaceInfo = namespaceQuery?.data?.data?.find(
        (namespace: any) =>
            namespace.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true",
    );

    useEffect(() => {
        if (variant === "ike-virtualization") {
            setValue("networkPattern", "Default");
        }
    }, [variant, setValue]);

    useEffect(() => {
        if (mode === "edit" && record) {
            reset(buildValuesFromRecord(record, variant));
        }
    }, [mode, record, reset, variant]);

    useEffect(() => {
        if (
            mode === "create" &&
            defaultNamespaceInfo?.metadata?.name
        ) {
            setValue("metadata.namespace", defaultNamespaceInfo.metadata.name);
        }
    }, [defaultNamespaceInfo, mode, setValue]);

    const { options: instanceTypeOptions } = useSelect({
        resource: "virtual_machine_cluster_instancetypes",
        optionLabel: "id",
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

    const networkPattern =
        variant === "ike-virtualization"
            ? "Default"
            : watch("networkPattern", "Default");
    const volumeType = watch("volumeType", "containerDisk");
    const additionalVolumes = watch("additionalVolumes");
    const currentNamespace = watch("metadata.namespace");

    const onFinishHandler = (data: VirtualMachineFormValues) => {
        onFinish(buildResource(data, variant, record));
    };

    const content = (
        <Box
            component="form"
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            autoComplete="off"
        >
            <Typography variant="body2" color="text.secondary">
                対象: {variantLabelMap[variant]}
            </Typography>

            <Typography variant="h6">Basic Information</Typography>
            <TextField
                {...register("metadata.name", { required: "Name is required" })}
                error={!!errors.metadata?.name}
                helperText={errors.metadata?.name?.message as string}
                label="Name"
                fullWidth
                InputLabelProps={{ shrink: true }}
                disabled={mode === "edit"}
            />

            <FormControl fullWidth>
                <InputLabel id="namespace-label">Namespace</InputLabel>
                <Select
                    labelId="namespace-label"
                    {...register("metadata.namespace", { required: "Namespace is required" })}
                    label="Namespace"
                    value={currentNamespace || ""}
                    error={!!errors.metadata?.namespace}
                >
                    {(namespaceQuery?.data?.data ?? []).map((item: any) => (
                        <MenuItem key={item.id} value={item.metadata.name}>
                            {item.metadata.name}
                        </MenuItem>
                    ))}
                </Select>
                {errors.metadata?.namespace && (
                    <FormHelperText error>
                        {errors.metadata?.namespace.message as string}
                    </FormHelperText>
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

            <NetworkPatternField variant={variant} register={register} />

            {variant === "ike-virtual-private-cluster" &&
                (networkPattern === "DefaultSecondary" || networkPattern === "PrimarySecondary") && (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, border: "1px dashed grey", p: 2, borderRadius: 1 }}>
                        <Typography variant="subtitle1">Secondary Networks</Typography>
                        {secondaryNetworkFields.map((field: any, index: number) => (
                            <Stack key={field.id} direction="row" spacing={2} alignItems="center">
                                <FormControl fullWidth>
                                    <InputLabel id={`secondary-network-label-${index}`}>
                                        Secondary Network {index + 1}
                                    </InputLabel>
                                    <Select
                                        labelId={`secondary-network-label-${index}`}
                                        {...register(`secondaryNetworks.${index}.name`, {
                                            required: "Secondary Network Name is required",
                                        })}
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
                                <IconButton
                                    onClick={() => removeSecondaryNetwork(index)}
                                    disabled={secondaryNetworkFields.length === 1}
                                    color="error"
                                >
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
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, border: "1px dashed grey", p: 2, borderRadius: 1 }}>
                    <TextField
                        {...register("containerDiskName", { required: "Volume Name is required" })}
                        error={!!errors.containerDiskName}
                        helperText={errors.containerDiskName?.message as string}
                        label="Volume Name"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <FormControl fullWidth>
                        <InputLabel id="container-image-label">Container Image</InputLabel>
                        <Select
                            labelId="container-image-label"
                            {...register("containerDiskImage", {
                                required: "Container Image is required",
                            })}
                            label="Container Image"
                            defaultValue="ikr.iij.jp/virt/rocky-int:9"
                            error={!!errors.containerDiskImage}
                        >
                            <MenuItem value="ikr.iij.jp/virt/rocky-int:9">ikr.iij.jp/virt/rocky-int:9</MenuItem>
                            <MenuItem value="ikr.iij.jp/virt/ubuntu-int:22.04">ikr.iij.jp/virt/ubuntu-int:22.04</MenuItem>
                            <MenuItem value="ikr.iij.jp/virt/ubuntu-debug-int:22.04">ikr.iij.jp/virt/ubuntu-debug-int:22.04</MenuItem>
                        </Select>
                        {errors.containerDiskImage && (
                            <FormHelperText error>
                                {errors.containerDiskImage.message as string}
                            </FormHelperText>
                        )}
                    </FormControl>
                </Box>
            )}

            {volumeType === "dataVolume" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, border: "1px dashed grey", p: 2, borderRadius: 1 }}>
                    <TextField
                        {...register("dataVolumeVolumeName", { required: "Volume Name is required" })}
                        error={!!errors.dataVolumeVolumeName}
                        helperText={errors.dataVolumeVolumeName?.message as string}
                        label="Volume Name"
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

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, border: "1px dashed grey", p: 2, borderRadius: 1 }}>
                {additionalVolumeFields.map((field: any, index: number) => (
                    <Box key={field.id} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1, position: "relative" }}>
                        <IconButton
                            onClick={() => removeAdditionalVolume(index)}
                            color="error"
                            sx={{ position: "absolute", top: 8, right: 8 }}
                        >
                            <DeleteIcon />
                        </IconButton>
                        <Stack spacing={2}>
                            <Typography variant="subtitle2">Volume {index + 1}</Typography>
                            <TextField
                                {...register(`additionalVolumes.${index}.name`, {
                                    required: "Volume Name is required",
                                })}
                                label="Volume Name"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                            />
                            <FormControl fullWidth>
                                <InputLabel>Volume Type</InputLabel>
                                <Select
                                    {...register(`additionalVolumes.${index}.type`, {
                                        required: "Type is required",
                                    })}
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
                                    {...register(`additionalVolumes.${index}.pvcClaimName`, {
                                        required: "Claim Name is required",
                                    })}
                                    label="Claim Name"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}

                            {additionalVolumes && additionalVolumes[index]?.type === "configMap" && (
                                <TextField
                                    {...register(`additionalVolumes.${index}.configMapName`, {
                                        required: "ConfigMap Name is required",
                                    })}
                                    label="ConfigMap Name"
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                />
                            )}

                            {additionalVolumes && additionalVolumes[index]?.type === "secret" && (
                                <TextField
                                    {...register(`additionalVolumes.${index}.secretName`, {
                                        required: "Secret Name is required",
                                    })}
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
    );

    if (mode === "create") {
        return <Create saveButtonProps={{ onClick: handleSubmit(onFinishHandler) }}>{content}</Create>;
    }

    return <Edit saveButtonProps={{ onClick: handleSubmit(onFinishHandler) }}>{content}</Edit>;
};
