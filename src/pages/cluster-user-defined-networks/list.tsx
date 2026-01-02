import {
    List,
    ShowButton,
    useDataGrid,
} from "@refinedev/mui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface CUDNRow {
    id: number;
    metadata: {
        name: string;
    };
    spec: {
        network: {
            topology: string;
        }
    };
}

export const ClusterUserDefinedNetworkList = () => {
    const { dataGridProps } = useDataGrid();

    const columns: GridColDef[] = [
        {
            field: "id",
            headerName: "ID",
            type: "number",
            minWidth: 50,
        },
        {
            field: "metadata.name",
            headerName: "Name",
            minWidth: 200,
            valueGetter: (_value, row) => {
                return (row as CUDNRow)?.metadata?.name;
            }
        },
        {
            field: "spec.network.topology",
            headerName: "Topology",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as CUDNRow)?.spec?.network?.topology;
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            renderCell: ({ row }) => (
                <>
                    <ShowButton hideText recordItemId={row.id} />
                </>
            ),
            align: "center",
            headerAlign: "center",
            minWidth: 80,
        },
    ];

    return (
        <List>
            <DataGrid {...dataGridProps} columns={columns} autoHeight />
        </List>
    );
};
