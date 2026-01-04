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
            layer2?: {
                subnets?: string[];
            };
            localnet?: {
                subnets?: string[];
                physicalNetworkName?: string;
            };
        };
        namespaceSelector?: {
            matchExpressions?: {
                key: string;
                operator: string;
                values: string[];
            }[];
        };
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
            flex: 1,
            valueGetter: (_value, row) => {
                return (row as CUDNRow)?.metadata?.name;
            }
        },
        {
            field: "namespaces",
            headerName: "Namespaces",
            minWidth: 250,
            valueGetter: (_value, row) => {
                const expressions = (row as CUDNRow)?.spec?.namespaceSelector?.matchExpressions;
                if (expressions) {
                    const namespaceExpr = expressions.find(
                        (expr: any) =>
                            expr.key === "kubernetes.io/metadata.name" &&
                            expr.operator === "In"
                    );
                    if (namespaceExpr && namespaceExpr.values) {
                        return namespaceExpr.values.join(", ");
                    }
                }
                return "All"; // Or empty string, depending on interpretation of empty selector
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
            field: "spec.network.layer2.subnets",
            headerName: "Subnet",
            minWidth: 200,
            valueGetter: (_value, row) => {
                const network = (row as CUDNRow)?.spec?.network;
                if (network?.topology === "Layer2" && network?.layer2?.subnets) {
                    return network.layer2.subnets.join(", ");
                }
                if (network?.topology === "Localnet" && network?.localnet?.subnets) {
                    return network.localnet.subnets.join(", ");
                }
                return "";
            }
        },
        {
            field: "spec.network.localnet.physicalNetworkName",
            headerName: "Physical Network",
            minWidth: 150,
            valueGetter: (_value, row) => {
                const network = (row as CUDNRow)?.spec?.network;
                if (network?.topology === "Localnet" && network?.localnet?.physicalNetworkName) {
                    return network.localnet.physicalNetworkName;
                }
                return "";
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
