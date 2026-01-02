import { Show, TextFieldComponent } from "@refinedev/mui";
import { Typography, Stack } from "@mui/material";
import { useShow } from "@refinedev/core";

export const UserDefinedNetworkShow = () => {
    const { queryResult } = useShow() as any;
    const { data, isLoading } = queryResult;

    const record = data?.data;

    if (isLoading) return <div>Loading...</div>;

    const isLayer2 = !!record?.spec?.layer2;
    const topology = record?.spec?.topology || (isLayer2 ? "Layer2" : "Layer3");
    const subnets = isLayer2 ? record?.spec?.layer2?.subnets : record?.spec?.layer3?.subnets;

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
                    {topology} {isLayer2 ? "(Secondary)" : "(Primary)"}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    Subnets
                </Typography>
                <Typography variant="body2">
                    {subnets?.join(", ") || "None"}
                </Typography>

                <Typography variant="body1" fontWeight="bold">
                    IPAM Mode
                </Typography>
                <Typography variant="body2">
                    {isLayer2 ? record?.spec?.layer2?.ipam?.mode : record?.spec?.layer3?.ipam?.mode}
                </Typography>
            </Stack>
        </Show>
    );
};
