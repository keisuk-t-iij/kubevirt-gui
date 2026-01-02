import { Create, useAutocomplete } from "@refinedev/mui";
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Typography } from "@mui/material";
import { useForm } from "@refinedev/react-hook-form";
import { useSelect } from "@refinedev/core";

// Type definitions for form data
interface UserDefinedNetworkFormValues {
    metadata: {
        name: string;
        // namespace is usually handled by the provider context or user selection if multi-tenant
    };
    networkType: "Layer2" | "Layer3";
    subnet: string;
}

export const UserDefinedNetworkCreate = () => {
    const {
        saveButtonProps,
        refineCore: { onFinish },
        register,
        control,
        formState: { errors },
        handleSubmit,
        watch
    } = useForm<UserDefinedNetworkFormValues, any, UserDefinedNetworkFormValues>();

    const networkType = watch("networkType", "Layer2");

    const onFinishHandler = (data: UserDefinedNetworkFormValues) => {
        // Transform form data to Kubernetes resource structure
        const resource: any = {
            apiVersion: "k8s.ovn.org/v1",
            kind: "UserDefinedNetwork",
            metadata: {
                name: data.metadata.name,
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
                ipam: {
                    mode: "Enabled",
                    lifecycle: "Persistent"
                }
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

                <TextField
                    {...register("subnet", {
                        required: networkType === "Layer2" ? "This field is required" : false,
                        pattern: {
                            value: /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
                            message: "Invalid CIDR format (e.g., 192.168.1.0/24)"
                        }
                    })}
                    disabled={networkType === "Layer3"}
                    error={!!errors.subnet}
                    helperText={(errors.subnet?.message as string) || (networkType === "Layer3" ? "Subnet is not configurable for Layer 3 (Primary) networks" : "CIDR notation (e.g. 192.168.1.0/24)")}
                    margin="normal"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    type="text"
                    label="Subnet"
                    name="subnet"
                />
            </Box>
        </Create>
    );
};
