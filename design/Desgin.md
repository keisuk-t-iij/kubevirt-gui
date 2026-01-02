
# Design

## リソース

このアプリケーションは、Kubernetesの３つのリソースを参照および編集するためのものです。

- UserDefinedNetwork
- ClusterUserDefinedNetwork
- VirutalMachine

Kubernetesにはkubevirtとovn-kubernetesがインストールされていることを前提としています。

### UserDefinedNetwork

UserDefinedNetworkはさまざまなコンフィグレーションに対応していますが、このアプリケーションでは以下のコンフィグレーションのみをサポートします。

- primary networkを作成する場合、layer3モードを必須とします
- secondary networkを作成する場合、layer2モードを必須とします

### ClusgterUserDefinedNetwork

ClusterUserDefinedNetworkは、このアプリケーションで作成したり編集することはできず、参照することだけができます。
ClusterUserDefinedNetworkはクラスタスコープのリソースであるため、一般ユーザーの権限では作成を許可できないからです。

### VirtualMachine

VirtualMachineには多数の設定項目があるが、このアプリケーションでは一定のテンプレートに基づき、その範囲でのみコンフィグレーションを行います。

設定項目は以下の通りです。

- リソース名
- ネームスペース名
- インスタンスタイプ
- ネットワーク
- ボリューム

リソース名は必須項目です。VirutalMachineリソースの名前であり、またゲストOSのホスト名でもあります。
ネームスペース名は必須項目です。VirutalMachineリソースが作成されるネームスペース名です。
インスタンスタイプは必須項目です。設定可能なインスタンスタイプは、KubernetesにVirtualMachineClusterInstancetypeリソースとして定義されているものから一つ選択して指定します。
ネットワークはVirtualMachineのネットワーク構成に応じて、さまざまな設定が可能です。詳細は別項で説明します。
ボリュームはVirtualMachineのボリューム構成に応じて、さまざまな設定が可能です。詳細は別項で説明します。

上記設定項目の具体的な値を除いたテンプレートは下記のとおりです。

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: <リソース名>
spec:
  instancetype:
    name: <インスタンスタイプ>
  runStrategy: Always
  template:
    spec:
      domain:
        devices:
          interfaces: [<ネットワークインターフェイス>]
          disks: [<ディスク>]
        resources: {}
      networks: [<ネットワーク>]
      volumes: [<ボリューム>]
```

## ネットワークとUserDefinedNetwork


1. セカンダリネットワーク
2. プライマリネットワーク
3. クラスタスコープのセカンダリネットワーク
4. クラスタスコープのローカルネット

### セカンダリネットワーク

セカンダリネットワークは、UserDefinedNetworkリソースとして作成します。セカンダリネットワークを作成するとき、そのネットワークで利用するサブネットを指定することができます。例えば、192.168.1.0/24のようなサブネットを指定することができます。

```yaml
apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: <リソース名>
spec:
  layer2:
    role: Secondary
    subnets: [<サブネット>]
    ipam:
      mode: Enabled
      lifecycle: Persistent
  topology: Layer2
```

### プライマリネットワーク

プライマリネットワークは、UserDefinedNetworkリソースとして作成します。プライマリネットワークを作成するとき、そのネットワークで利用するサブネットを指定することができます。例えば、192.168.1.0/24のようなサブネットを指定することができます。

```yaml
apiVersion: k8s.ovn.org/v1
kind: UserDefinedNetwork
metadata:
  name: <リソース名>
spec:
  layer3:
    role: Primary
    subnets: [<サブネット>]
    ipam:
      mode: Enabled
      lifecycle: Persistent
  topology: Layer3
```

### クラスタスコープのセカンダリネットワーク

クラスタスコープのセカンダリネットワークは、ClusterUserDefinedNetworkリソースとして作成します。
クラスタスコープのセカンダリネットワークを作成するとき、そのネットワークで利用するサブネットと、このネットワークへのアクセスを許可するネームスペースのリストを指定します。このリストにないネームスペースのVirtualMachineはこのネットワークに接続できません。


```yaml
apiVersion: k8s.ovn.org/v1
kind: ClusterUserDefinedNetwork
metadata:
  name: <リソース名>
spec:
  namespaceSelector:
    matchExpressions:
    - key: kubernetes.io/metadata.name
      operator: In
      values: [<ネームスペース名のリスト>]
  network:
    topology: Layer2
    layer2:
      role: Secondary
      subnets: [<サブネット>]
      ipam:
        mode: Enabled
        lifecycle: Persistent
```

### クラスタスコープのローカルネット

クラスタスコープのローカルネットワークは、ClusterUserDefinedNetworkリソースとして作成します。
クラスタスコープのローカルネットワークを作成するとき、そのネットワークで利用するサブネットと、このネットワークへのアクセスを許可するネームスペースのリストを指定します。このリストにないネームスペースのVirtualMachineはこのネットワークに接続できません。
また、ローカルネットワークは、クラスタスコープのセカンダリネットワークと異なり、物理ネットワーク名を指定する必要があります。

```yaml
apiVersion: k8s.ovn.org/v1
kind: ClusterUserDefinedNetwork
metadata:
  name: <リソース名>
spec:
  namespaceSelector:
    matchExpressions:
    - key: kubernetes.io/metadata.name
      operator: In
      values: [<ネームスペース名のリスト>]
  network:
    topology: Localnet
    localnet:
      role: Secondary
      physicalNetworkName: <物理ネットワーク名>
      subnets: [<サブネット>]
      ipam:
        mode: Enabled
        lifecycle: Persistent
```

## ネットワークとVirtualMachine

VirtualMachineに設定できるネットワーク構成を大きく分類すると、下記の４種類となります。

1. デフォルトネットワーク構成
2. デフォルトネットワークにセカンダリネットワークを追加した構成
3. デフォルトネットワークをプライマリネットワークで置換した構成
4. デフォルトネットワークをプライマリネットワークで置換し、かつセカンダリネットワークを追加した構成

VirtualMachineには必ず１つのpod networkが接続されます。そして、pod networkはほとんどの場合デフォルトネットワークとして構成されますが、これをプライマリネットワークで置き換えることが可能です。
VirtualMachineにセカンダリネットワークを接続するかは任意です。また、必要に応じて２つ以上のセカンダリネットワークを接続することが可能です。

VirtualMachineに接続されるネットワークは、デフォルトネットワークを除いてUserDefinedNetworkとして利用者が明示的に作成する必要があります。UserDefinedNetworkはネームスペーススコープのリソースであるため、同一のUserDefinedNetworkに接続できるVirutalMachineはすべて同じネームスペースに作成する必要があります。

一方、ClusterUserDefinedNetworkを利用すると、複数のネームスペースにまたがるVirtualMachineに同じネットワークを接続することができます。ClusterUserDefinedNetworkはセカンダリネットワークとして利用することができます。

### デフォルトネットワーク構成

デフォルトネットワーク構成のVirtualMachineは、interfacessとnetworksの設定が以下のようになります。コンフィグレーション可能なパラメータはありません。

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: <リソース名>
spec:
  instancetype:
    name: <インスタンスタイプ>
  runStrategy: Always
  template:
    spec:
      domain:
        devices:
          interfaces:
          - name: default
            masquerade: {}
          disks: [<ディスク>]
        resources: {}
      networks:
      - name: default
        pod: {}
      volumes: [<ボリューム>]
```

### デフォルトネットワークにセカンダリネットワークを追加した構成

セカンダリネットワークを追加する場合、interfacessとnetworksの設定が以下のようになります。netrworkNameに接続したいUserDefinedNetworkのネームスペースとリソース名を指定します。
なお、セカンダリネットワークを２つ以上追加する場合は、それぞれ異なる名前を指定する必要があります。

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: <リソース名>
spec:
  instancetype:
    name: <インスタンスタイプ>
  runStrategy: Always
  template:
    spec:
      domain:
        devices:
          interfaces:
          - name: default
            masquerade: {}
          - name: secondary
            bridge: {}
          disks: [<ディスク>]
        resources: {}
      networks:
      - name: default
        pod: {}
      - name: secondary
        multus:
          networkName: <セカンダリネットワーク名>
      volumes: [<ボリューム>]
```

### デフォルトネットワークをプライマリネットワークで置換した構成

デフォルトネットワークをプライマリネットワークで置換する場合、interfacessとnetworksの設定が以下のようになります。つまり、デフォルトネットワーク構成と同じです。デフォルトネットワークをプライマリネットワークで置換する設定はネームスペースリソースのラベルによって行われるため、VirtualMachineリソースに対する設定はありません。そのネームスペースに作成されたすべてのVirtualMachineリソースがデフォルトネットワークをプライマリネットワークで置換する設定となります。


```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: <リソース名>
spec:
  instancetype:
    name: <インスタンスタイプ>
  runStrategy: Always
  template:
    spec:
      domain:
        devices:
          interfaces:
          - name: primary
            masquerade: {}
          disks: [<ディスク>]
        resources: {}
      networks:
      - name: primary
        pod: {}
      volumes: [<ボリューム>]
```

### デフォルトネットワークをプライマリネットワークで置換し、かつセカンダリネットワークを追加した構成

デフォルトネットワークをプライマリネットワークで置換し、かつセカンダリネットワークを追加した構成の場合、interfacessとnetworksの設定が以下のようになります。つまり、デフォルトネットワーク構成にセカンダリネットワークを追加した構成と同じです。

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  name: <リソース名>
spec:
  instancetype:
    name: <インスタンスタイプ>
  runStrategy: Always
  template:
    spec:
      domain:
        devices:
          interfaces:
          - name: default
            masquerade: {}
          - name: secondary
            bridge: {}
          disks: [<ディスク>]
        resources: {}
      networks:
      - name: default
        pod: {}
      - name: secondary
        multus:
          networkName: <セカンダリネットワーク名>
      volumes: [<ボリューム>]
```

## ボリューム

VirtualMachineのボリュームは以下の種類がありますが、最初はContainerDiskのみサポートします。

1. DataVolume
2. CloudInitNoCloud
3. CloudInitByNet
4. ContainerDisk
5. Ephemeral
6. PersistentVolumeClaim

### containerDisk

containerDiskを利用する場合のVirtualMachineリソースは下記のようになります。本来はspec.template.spec.domain.devices.disksにも設定が必要ですが、このケースでは省略可能なので設定していません。

```yaml
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  creationTimestamp: null
  name: rocky9-default
spec:
  instancetype:
    name: u1.small
  runStrategy: Always
  template:
    metadata:
      creationTimestamp: null
    spec:
      domain:
        devices:
          interfaces:
          - name: default
            masquerade: {}
        resources: {}
      networks:
      - name: default
        pod: {}
      terminationGracePeriodSeconds: 180
      volumes:
      - containerDisk:
          image: ikr.iij.jp/virt/rocky-int:9
        name: rocky-containerdisk-0
```



