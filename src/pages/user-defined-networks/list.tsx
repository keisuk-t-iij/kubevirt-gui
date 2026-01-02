import {
    List,
    ShowButton,
    EditButton,
    DeleteButton,
    useDataGrid,
} from "@refinedev/mui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface UDNRow {
    id: number;
    metadata: {
        name: string;
    };
    spec: {
        layer2?: any;
        layer3?: any;
    };
}

export const UserDefinedNetworkList = () => {
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
                return (row as UDNRow)?.metadata?.name;
            }
        },
        {
            field: "spec.layer2",
            headerName: "Type",
            minWidth: 150,
            valueGetter: (_value, row) => {
                if ((row as UDNRow)?.spec?.layer2) return "Layer 2 (Secondary)";
                if ((row as UDNRow)?.spec?.layer3) return "Layer 3 (Primary)";
                return "Unknown";
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            renderCell: ({ row }) => (
                <>
                    <EditButton hideText recordItemId={row.id} />
                    <ShowButton hideText recordItemId={row.id} />
                    <DeleteButton hideText recordItemId={row.id} />
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
