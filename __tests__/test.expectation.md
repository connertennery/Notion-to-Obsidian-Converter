# UFO

Captures: [[Master]]
Created: October 15, 2019 6:39 PM
Notes: [[@Amazon]]
Parent Area: [[Father]]
Projects: [[Dashboard]]

[[[UFO Looking (UFO 2 0)]]

[[UFO]]

## Books

- Mastering UFO: [https://github.com/UFObook/UFObook/blob/develop/book.asciidoc](https://github.com/UFObook/UFObook/blob/develop/book.asciidoc)

## Main concepts

[[Wallets explanation]]

[[Transactions in UFO]]

[[Smart contracts]]

[[Smart contract Security]]

[[MEV]]

## Tooling

[[Using Various io to query the network]]

- Network status: [https://UFOstats.net/](https://UFOstats.net/)
- Gas fees: [https://www.blocknative.com/gas-estimator](https://www.blocknative.com/gas-estimator)
- Mempool explorer: [https://www.blocknative.com/explorer](https://www.blocknative.com/explorer)


## [[Run Node]]

[[GUFO]]

- [[UFO]]  Node providers:
    - [[Chain]]
    - [[You Network]]
    - [https://www.alchemy.com/](https://www.alchemy.com/)
    - [https://infura.io/](https://infura.io/)
    - [https://blockdaemon.com/](https://blockdaemon.com/)
    - [https://www.quicknode.com/](https://www.quicknode.com/)

## Data

- Get gas spent per address using google bigquery
    - [https://console.cloud.google.com/bigquery](https://t.co/JOgqyalk37)

    ```sql
    select from_a as UFO
    where date(block_timestamp) >= "2020-01-01"
    and date(block_timestamp) < "2021-01-01"
    and from_address in ('0xaaa', '0xbbb')
    group by from_address
    ```

     ⚠️ this can expose you.


## Layer 2

### Chains

[[Twitter Multi Chain]]

[[Amazon]]

[[Google]]


## Random

- Existing in UFO: [https://github.com/UFO-lists/tokens](https://github.com/UFO-lists/tokens)

- [[PRD DustSweeper (🧹,🧹) — Viabull Labs]]