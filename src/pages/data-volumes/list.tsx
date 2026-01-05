import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import {
    List,
    useDataGrid,
    EditButton,
    ShowButton,
    DeleteButton,
} from "@refinedev/mui";
import { useDeleteMany } from "@refinedev/core";
import Button from "@mui/material/Button";
import React from "react";

export const DataVolumeList = () => {
    const { dataGridProps } = useDataGrid();
    const { mutate: deleteMany } = useDeleteMany();
    const [rowSelectionModel, setRowSelectionModel] = React.useState<any[]>([]);

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", type: "number", width: 50 },
        {
            field: "metadata",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            valueGetter: (_value, row) => row?.metadata?.name
        },
        {
            field: "metadata.namespace",
            headerName: "Namespace",
            minWidth: 150,
            valueGetter: (_value, row) => row?.metadata?.namespace || "default"
        },
        {
            field: "spec.source",
            headerName: "Source Type",
            minWidth: 150,
            valueGetter: (_value, row) => {
                const source = row?.spec?.source;
                if (source?.http) return "HTTP";
                if (source?.pvc) return "PVC";
                return "Unknown";
            }
        },
        {
            field: "spec.source.pvc.name",
            headerName: "Source Name",
            minWidth: 150,
            valueGetter: (_value, row) => {
                const source = row?.spec?.source;
                if (source?.pvc) return source.pvc.name;
                return "";
            }
        },
        {
            field: "spec.pvc.resources.requests.storage",
            headerName: "Size",
            minWidth: 100,
            valueGetter: (_value, row) => row?.spec?.pvc?.resources?.requests?.storage || row?.spec?.storage?.resources?.requests?.storage
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            renderCell: function render({ row }: { row: any }) {
                return (
                    <>
                        <EditButton hideText recordItemId={row.id} />
                        <ShowButton hideText recordItemId={row.id} />
                        <DeleteButton hideText recordItemId={row.id} />
                    </>
                );
            },
            align: "center",
            headerAlign: "center",
            minWidth: 80,
        },
    ];

    return (
        <List headerButtons={({ defaultButtons }) => (
            <>
                {defaultButtons}
                {rowSelectionModel.length > 0 && (
                    <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                            deleteMany({
                                resource: "data_volumes",
                                ids: rowSelectionModel,
                            });
                            setRowSelectionModel([]);
                        }}
                    >
                        Delete Selected
                    </Button>
                )}
            </>
        )}>
            <DataGrid
                {...dataGridProps}
                columns={columns}
                autoHeight
                checkboxSelection
                onRowSelectionModelChange={(newRowSelectionModel) => {
                    setRowSelectionModel(newRowSelectionModel as any[]);
                }}
                rowSelectionModel={rowSelectionModel}
            />
        </List>
    );
};
