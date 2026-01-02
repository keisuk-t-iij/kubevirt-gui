#!/bin/bash

# ネットワークインターフェイスを一覧し、IPアドレスとMACアドレスを出力する

for iface in $(ip -o link show | awk -F': ' '{print $2}'); do
	ip_addr=$(ip -o -4 addr show dev "$iface" | awk '{print $4}' | cut -d/ -f1)
	mac_addr=$(ip link show "$iface" | awk '/link\// {print $2}')
	echo "$iface, ${ip_addr:-none}, $mac_addr"
done
