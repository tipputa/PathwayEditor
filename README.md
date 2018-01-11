# Metabolic Pathway Map Editor

Pathway Mapをテキストから描けるWebツールです。

index.htmlをブラウザで開いてください。

## Example
```
// Glycerol
[c1] (image100 TC) <8,24.5>
![image](img/c1.png "Glycerol")
=[g1]d(S l_w3)=>[c2]
<=[g2]u=[c2]

// G3P
[c2] <22,27.5>
 G3P
<pop>
![image] (img/c2.png "__sn__-glycerol 3-phosphate")
?[link] (http://www.genome.jp/dbget-bin/www_bget?C00681 "KEGG")
</pop>
=[g3](l_w3)=>[c3]

//Acetyl-G3P
[c3] <31.5,27.5>
Acyl-G3P
=[g4](l_w3)=>[c4]

// gene information
// g1 glycero 
g[g1]
GK
?[link](http://www.uniprot.org/uniprot/P32189 "2.7.1.30")

//g2
g[g2]
GPP1
?[link] (http://www.uniprot.org/uniprot/P32189 "3.1.3.21")

// g3 glycerol-3-phosphate O-acyltransferase
g[g3]
GPAT
?[link](http://www.uniprot.org/uniprot/Q53EU6 "2.3.1.15")
<pop>
?[link](http://www.genome.jp/dbget-bin/www_bget?K00629 "KEGG")
</pop>

```
![通常](https://user-images.githubusercontent.com/18391019/34704821-38b36fb8-f53f-11e7-954b-fb6c00812903.png)

G3Pにマウスホバー

![マウスホバー](https://user-images.githubusercontent.com/18391019/34704843-657580ae-f53f-11e7-8db0-0bdc3a78e497.png)

## 書式（仮）

### ブロック（化合物）の定義

```
[comp_name] (class) <x pos, y pos>
component
```
comp_nameはブロックのIDとして/[a-z0-9-_]+/。classはcssのためのクラス名。positionは自動的に設定される。

### ブロックのテーブル化

```
---
```
複数行に区切られているとtable要素になる。#でヘッダー

### 遺伝子の定義

```
g[gene_name] (class)
component
```
gene_nameはブロックのIDとして/[a-z0-9-_]+/。classはcssのためのクラス名。

### 代謝物間のリンク

通常の矢印

```
==>[comp_name]
```

クラス・矢印の向きの定義

```
u<=(class)=>d[comp_name]
```

classはリンクのSVG pathに適用されるクラス名。デフォルトのリンクはベジェ曲線だが、"S"を指定すると直線になる。
"<",">"は線の矢印を表す。両端に無くてもよい。
"u","d"の部分は、線の接続位置を表す。左が自ブロック、右が相手ブロックの指定。
"u"はブロックの上部中央、"d"は下部中央。"l"はブロックの左で、"r"は右になる。

リンクに遺伝子の追加・ラベル位置の定義

```
=[gene_ame]l(class)=>[name]
```

リンクに遺伝子情報を記載。[]と()の"u", "d", "l", "r"記載する位置を指定。
デフォルトは中央。

### popupの挿入

```
<pop>
この間に含まれているテキスト、画像、リンクがポップアップになる。
</pop>
```
複数業挿入可能

### 画像の挿入

```
![title](file "caption")
```

### URLの挿入

```
?[title](url "string")
```

### コメント

```
// comment
```




# Copyright
Copyright 2016 tipputa


The original copyright for MarkDownDiagram: https://github.com/wakufactory/MarkDownDiagram

Copyright 2016 Wakufactory 
http://wakufactory.jp/ twitter:@wakufactory

License: MIT 
