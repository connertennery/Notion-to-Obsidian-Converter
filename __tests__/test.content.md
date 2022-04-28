# UFO

Captures: ../Captures%20_NOTIONID_/Master%20_NOTIONID_.md
Created: October 15, 2019 6:39 PM
Notes: ../Notes%20_NOTIONID_/@Amazon%20_NOTIONID_.md
Parent Area: Father%20_NOTIONID_.md
Projects: ../Projects%20_NOTIONID_/Dashboard%20_NOTIONID_.md

[[UFO Looking (UFO 2.0)](../Notes%20_NOTIONID_/@UFO%20_NOTIONID_.md)

[UFO](UFO%20_NOTIONID_/UFO%20_NOTIONID_.md)

## Books

- Mastering UFO: [https://github.com/UFObook/UFObook/blob/develop/book.asciidoc](https://github.com/UFObook/UFObook/blob/develop/book.asciidoc)

## Main concepts

[Wallets explanation](UFO%20_NOTIONID_/Wallets%20_NOTIONID_.md)

[Transactions in UFO](UFO%20_NOTIONID_/Transactions%20_NOTIONID_.md)

[Smart contracts](UFO%20_NOTIONID_/Smart%20_NOTIONID_.md)

[Smart contract Security](UFO%20_NOTIONID_/Smart%20_NOTIONID_.md)

[MEV](../Notes%20_NOTIONID_/MEV%20_NOTIONID_.md)

## Tooling

[Using [Various.io](http://Various.io) to query the network](UFO%20_NOTIONID_/Using%20_NOTIONID_.md)

- Network status: [https://UFOstats.net/](https://UFOstats.net/)
- Gas fees: [https://www.blocknative.com/gas-estimator](https://www.blocknative.com/gas-estimator)
- Mempool explorer: [https://www.blocknative.com/explorer](https://www.blocknative.com/explorer)


## [Run Node](Cryptocurrencies%20_NOTIONID_/Run%20_NOTIONID_.md)

[GUFO](../Notes%20_NOTIONID_/GUFO%20_NOTIONID_.md)

- [UFO](UFO%20_NOTIONID_.md)  Node providers:
    - [Chain](../Notes%20_NOTIONID_/Chain%20_NOTIONID_.md)
    - [You Network](../Notes%20_NOTIONID_/You%20_NOTIONID_.md)
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

[Twitter / Multi Chain](UFO%20_NOTIONID_/Twitter%20_NOTIONID_.md)

[Amazon](UFO%20_NOTIONID_/Amazon%20_NOTIONID_.md)

[Google](UFO%20_NOTIONID_/Google%20_NOTIONID_.md)


## Random

- Existing in UFO: [https://github.com/UFO-lists/tokens](https://github.com/UFO-lists/tokens)

- [PRD: DustSweeper (🧹,🧹) — Viabull Labs](../My%20_NOTIONID_/PRD%20_NOTIONID_.md)