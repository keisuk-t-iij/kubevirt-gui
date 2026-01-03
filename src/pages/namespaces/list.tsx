import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useDataGrid, List, EditButton, ShowButton, DeleteButton } from "@refinedev/mui";
import React from "react";
import { Chip } from "@mui/material";

export const NamespaceList = () => {
    const { dataGridProps } = useDataGrid();

    const columns: GridColDef[] = [
        { field: "id", headerName: "ID", width: 50 },
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            valueGetter: (_value, row) => row?.metadata?.name,
        },
        {
            field: "primaryNetwork",
            headerName: "Primary Network",
            minWidth: 150,
            renderCell: ({ row }) => {
                const isPrimary = row?.metadata?.labels?.["openstack.org/primary-network"] === "true";
                return isPrimary ? <Chip label="Yes" color="primary" size="small" /> : <Chip label="No" size="small" variant="outlined" />;
            }
        },
        {
            field: "defaultNamespace",
            headerName: "Default Namespace",
            minWidth: 150,
            renderCell: ({ row }) => {
                const isDefault = row?.metadata?.annotations?.["kubevirt-gui/default-namespace"] === "true";
                return isDefault ? <Chip label="Default" color="success" size="small" /> : null;
            }
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            renderCell: function render({ row }) {
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
        <List>
            <DataGrid {...dataGridProps} columns={columns} autoHeight />
        </List>
    );
};
