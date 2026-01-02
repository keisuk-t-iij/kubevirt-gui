import { useShow, IResourceComponentsProps } from "@refinedev/core";
import {
    Show,
    TextFieldComponent,
} from "@refinedev/mui";
import { Typography, Stack } from "@mui/material";

export const DataVolumeShow: React.FC<IResourceComponentsProps> = () => {
    const { queryResult } = useShow() as any;
    const { data, isLoading } = queryResult;

    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Stack gap={1}>
                <Typography variant="body1" fontWeight="bold">
                    ID
                </Typography>
                <TextFieldComponent value={record?.id} />

                <Typography variant="body1" fontWeight="bold">
                    Name
                </Typography>
                <TextFieldComponent value={record?.metadata?.name} />

                <Typography variant="body1" fontWeight="bold">
                    Namespace
                </Typography>
                <TextFieldComponent value={record?.metadata?.namespace} />

                <Typography variant="body1" fontWeight="bold">
                    Storage Size
                </Typography>
                <TextFieldComponent value={record?.spec?.pvc?.resources?.requests?.storage} />

                <Typography variant="body1" fontWeight="bold">
                    Source
                </Typography>
                {record?.spec?.source?.http && (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="body2" fontWeight="bold">HTTP URL:</Typography>
                        <TextFieldComponent value={record?.spec.source.http.url} />
                    </Stack>
                )}
                {record?.spec?.source?.pvc && (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="body2" fontWeight="bold">PVC Name:</Typography>
                        <TextFieldComponent value={record?.spec.source.pvc.name} />
                    </Stack>
                )}
            </Stack>
        </Show>
    );
};
