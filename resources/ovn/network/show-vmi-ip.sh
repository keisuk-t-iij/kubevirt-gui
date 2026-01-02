kubectl get vmi -oname | sed -e 's/virtualmachineinstance.kubevirt.io/vmi/' | while read VMI; do echo $VMI; ssh -q $VMI < show.sh; done
