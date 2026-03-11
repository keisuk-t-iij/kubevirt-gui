import { VirtualMachineFormPage } from "./form.tsx";

export const VirtualMachineVirtualizationCreate = () => {
    return <VirtualMachineFormPage mode="create" variant="ike-virtualization" />;
};

export const VirtualMachineVpcCreate = () => {
    return <VirtualMachineFormPage mode="create" variant="ike-virtual-private-cluster" />;
};

export const VirtualMachineCreate = VirtualMachineVpcCreate;
