import { Show } from "@refinedev/mui";
import { Typography, Stack } from "@mui/material";
import { useShow } from "@refinedev/core";

export const ClusterUserDefinedNetworkShow = () => {
    const { queryResult } = useShow() as any;
    const { data, isLoading } = queryResult;

    const record = data?.data;

    if (isLoading) return <div>Loading...</div>;

    const topology = record?.spec?.network?.topology;
    // CUDN can be Layer2 or Localnet
    const networkSpec = topology === "Localnet" ? record?.spec?.network?.localnet : record?.spec?.network?.layer2;

    return (
        <Show isLoading={isLoading}>
            <Stack gap={1}>
                <Typography variant="body1" fontWeight="bold">
                    Name
                </Typography>
                <Typography variant="body2">
                    {record?.metadata?.name}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    Topology
                </Typography>
                <Typography variant="body2">
                    {topology}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    Role
                </Typography>
                <Typography variant="body2">
                    {networkSpec?.role}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    Subnets
                </Typography>
                <Typography variant="body2">
                    {networkSpec?.subnets?.join(", ") || "None"}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    Target Namespaces
                </Typography>
                <Typography variant="body2">
                    {record?.spec?.namespaceSelector?.matchExpressions?.[0]?.values?.join(", ") || "All/None"}
                </Typography>
            </Stack>
        </Show>
    );
};
