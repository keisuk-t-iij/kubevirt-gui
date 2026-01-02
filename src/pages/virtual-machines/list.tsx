import {
    List,
    ShowButton,
    EditButton,
    DeleteButton,
    useDataGrid,
} from "@refinedev/mui";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

interface VMRow {
    id: number;
    metadata: {
        name: string;
        namespace: string;
    };
    spec: {
        instancetype: {
            name: string;
        };
        runStrategy: string;
    };
    status: {
        printableStatus: string;
    };
}

export const VirtualMachineList = () => {
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
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.metadata?.name;
            }
        },
        {
            field: "metadata.namespace",
            headerName: "Namespace",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.metadata?.namespace;
            }
        },
        {
            field: "status.printableStatus",
            headerName: "Status",
            minWidth: 120,
            valueGetter: (_value, row) => {
                // Determine status. Usually in status.printableStatus for VirtualMachine
                return (row as VMRow)?.status?.printableStatus || "Unknown";
            }
        },
        {
            field: "spec.instancetype.name",
            headerName: "Instance Type",
            minWidth: 150,
            valueGetter: (_value, row) => {
                return (row as VMRow)?.spec?.instancetype?.name;
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
