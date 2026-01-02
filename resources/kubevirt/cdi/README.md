wget https://github.com/kubevirt/containerized-data-importer/releases/download/v1.59.0/cdi-operator.yaml
# wget https://github.com/kubevirt/containerized-data-importer/releases/download/v1.59.0/cdi-cr.yaml

cdi-ci.yamlを手書きを利用

kubectl sudo annotate sc hpe-standard01 storageclass.kubevirt.io/is-default-virt-class=true
kubectl sudo patch storageprofile nfs-client --type=merge -p '{"spec": {"claimPropertySets": [{"accessModes": ["ReadWriteOnce"], "volumeMode": "Filesystem"}]}}'
kubectl sudo patch storageprofile managed-nfs-storage --type=merge -p '{"spec": {"claimPropertySets": [{"accessModes": ["ReadWriteOnce"], "volumeMode": "Filesystem"}]}}'
kubectl sudo patch storageprofile nfs-subdir-external-provisioner --type=merge -p '{"spec": {"claimPropertySets": [{"accessModes": ["ReadWriteOnce"], "volumeMode": "Filesystem"}]}}'



https://kubevirt.io/cdi-api-reference/v1.59.0/index.html
https://zenn.dev/imksoo/articles/062026e8d71071
