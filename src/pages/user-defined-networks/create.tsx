import { Create, useAutocomplete } from "@refinedev/mui";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useSelect } from "@refinedev/core";
import { useEffect } from "react";

// Type definitions for form data
interface UserDefinedNetworkFormValues {
    metadata: {
        name: string;
        namespace: string;
    };
    networkType: "Layer2" | "Layer3";
    subnet?: string;
    layer3Cidr?: string;
    layer3HostSubnet?: number;
}

export const UserDefinedNetworkCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        formState: { errors },
        watch,
        handleSubmit,
        setValue
    } = useForm<UserDefinedNetworkFormValues, any, UserDefinedNetworkFormValues>({
        defaultValues: {
            networkType: "Layer2",
            metadata: {
                namespace: "default"
            }
        }
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

    const networkType = watch("networkType", "Layer2");

    const onFinishHandler = (data: UserDefinedNetworkFormValues) => {
        // Transform form data to Kubernetes resource structure
        const resource: any = {
            apiVersion: "k8s.ovn.org/v1",
            kind: "UserDefinedNetwork",
            metadata: {
                name: data.metadata.name,
                namespace: data.metadata.namespace,
            },
            spec: {}
        };

        if (data.networkType === "Layer2") {
            resource.spec.topology = "Layer2";
            resource.spec.layer2 = {
                role: "Secondary",
                subnets: [data.subnet],
                ipam: {
                    mode: "Enabled",
                    lifecycle: "Persistent"
                }
            };
        } else {
            resource.spec.topology = "Layer3";
            resource.spec.layer3 = {
                role: "Primary",
                subnets: [
                    {
                        cidr: data.layer3Cidr,
                        hostSubnet: Number(data.layer3HostSubnet)
                    }
                ]
            };
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
                <FormControl fullWidth margin="normal">
                    <InputLabel id="namespace-label">Namespace</InputLabel>
                    <Select
                        labelId="namespace-label"
                        {...register("metadata.namespace", { required: "This field is required" })}
                        label="Namespace"
                        defaultValue=""
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

                <TextField
                    {...register("metadata.name", {
                        required: "This field is required",
                    })}
                    error={!!errors.metadata?.name}
                    helperText={errors.metadata?.name?.message as string}
                    margin="normal"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    type="text"
                    label="Name"
                    name="metadata.name"
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel id="network-type-label">Network Type</InputLabel>
                    <Select
                        labelId="network-type-label"
                        {...register("networkType", { required: "This field is required" })}
                        defaultValue="Layer2"
                        label="Network Type"
                    >
                        <MenuItem value="Layer2">Layer 2 (Secondary)</MenuItem>
                        <MenuItem value="Layer3">Layer 3 (Primary)</MenuItem>
                    </Select>
                    <FormHelperText>
                        {networkType === "Layer2"
                            ? "Creates a secondary network in Layer 2 mode."
                            : "Creates a primary network in Layer 3 mode. Use this to replace the default pod network."}
                    </FormHelperText>
                </FormControl>

                {networkType === "Layer2" && (
                    <TextField
                        {...register("subnet", {
                            required: "This field is required",
                            pattern: {
                                value: /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
                                message: "Invalid CIDR format (e.g., 192.168.1.0/24)"
                            }
                        })}
                        error={!!errors.subnet}
                        helperText={(errors.subnet?.message as string) || "CIDR notation (e.g. 192.168.1.0/24)"}
                        margin="normal"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        type="text"
                        label="Subnet"
                        name="subnet"
                    />
                )}

                {networkType === "Layer3" && (
                    <>
                        <TextField
                            {...register("layer3Cidr", {
                                required: "This field is required for Layer 3",
                                pattern: {
                                    value: /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
                                    message: "Invalid CIDR format (e.g., 10.10.0.0/16)"
                                }
                            })}
                            error={!!errors.layer3Cidr}
                            helperText={(errors.layer3Cidr?.message as string) || "CIDR notation (e.g. 10.10.0.0/16)"}
                            margin="normal"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            type="text"
                            label="CIDR"
                        />
                        <TextField
                            {...register("layer3HostSubnet", {
                                required: "This field is required for Layer 3",
                                min: { value: 1, message: "Must be greater than 0" },
                                max: { value: 128, message: "Must be less than 128" }
                            })}
                            error={!!errors.layer3HostSubnet}
                            helperText={(errors.layer3HostSubnet?.message as string) || "Host Subnet Prefix Length (e.g. 24)"}
                            margin="normal"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            type="number"
                            label="Host Subnet"
                        />
                    </>
                )}
            </Box>
        </Create>
    );
};
