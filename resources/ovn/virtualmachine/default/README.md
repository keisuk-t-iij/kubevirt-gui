
このフォルダはデフォルトのネットワーク構成を示すファイルを置く場所です。
UserDefinedNetworkによるネットワークの定義はありません。

このパターンの場合、VirtualMachineには下記の４つの項目のみが設定可能です。

- リソース名 : metadata.name
- ネームスペース名 : metadata.namespace
- インスタンスタイプ : spec.instancetype.name
- ディスク : spec.template.spec.volumes


