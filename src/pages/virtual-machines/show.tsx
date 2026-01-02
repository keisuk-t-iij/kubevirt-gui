import { Show } from "@refinedev/mui";
import { Typography, Stack, Divider, Box } from "@mui/material";
import { useShow } from "@refinedev/core";

export const VirtualMachineShow = () => {
    const { queryResult } = useShow() as any;
    const { data, isLoading } = queryResult;

    const record = data?.data;

    if (isLoading) return <div>Loading...</div>;

    const interfaces = record?.spec?.template?.spec?.domain?.devices?.interfaces || [];
    const networks = record?.spec?.template?.spec?.networks || [];
    const volumes = record?.spec?.template?.spec?.volumes || [];

    return (
        <Show isLoading={isLoading}>
            <Stack gap={1}>
                <Typography variant="h6">Metadata</Typography>
                <Typography variant="body2"><strong>Name:</strong> {record?.metadata?.name}</Typography>
                <Typography variant="body2"><strong>Namespace:</strong> {record?.metadata?.namespace}</Typography>
                <Typography variant="body2"><strong>Status:</strong> {record?.status?.printableStatus || "Unknown"}</Typography>

                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">Spec</Typography>
                <Typography variant="body2"><strong>Instance Type:</strong> {record?.spec?.instancetype?.name}</Typography>
                <Typography variant="body2"><strong>Run Strategy:</strong> {record?.spec?.runStrategy}</Typography>

                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">Networks</Typography>
                {networks.map((net: any, idx: number) => (
                    <Box key={idx} sx={{ ml: 2, mb: 1 }}>
                        <Typography variant="body2"><strong>Name:</strong> {net.name}</Typography>
                        <Typography variant="body2"><strong>Type:</strong> {net.pod ? "Pod" : net.multus ? "Multus" : "Unknown"}</Typography>
                        {net.multus && <Typography variant="body2"><strong>Network Name:</strong> {net.multus.networkName}</Typography>}
                    </Box>
                ))}

                <Divider sx={{ my: 1 }} />
                <Typography variant="h6">Volumes</Typography>
                {volumes.map((vol: any, idx: number) => (
                    <Box key={idx} sx={{ ml: 2, mb: 1 }}>
                        <Typography variant="body2"><strong>Name:</strong> {vol.name}</Typography>
                        <Typography variant="body2"><strong>Type:</strong> {vol.containerDisk ? "ContainerDisk" : "Other"}</Typography>
                        {vol.containerDisk && <Typography variant="body2"><strong>Image:</strong> {vol.containerDisk.image}</Typography>}
                    </Box>
                ))}
            </Stack>
        </Show>
    );
};
