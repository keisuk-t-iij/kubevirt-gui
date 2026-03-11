import { VirtualMachineFormPage } from "./form.tsx";

export const VirtualMachineVirtualizationEdit = () => {
    return <VirtualMachineFormPage mode="edit" variant="ike-virtualization" />;
};

export const VirtualMachineVpcEdit = () => {
    return <VirtualMachineFormPage mode="edit" variant="ike-virtual-private-cluster" />;
};

export const VirtualMachineEdit = VirtualMachineVpcEdit;
