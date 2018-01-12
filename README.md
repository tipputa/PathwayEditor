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

[comp_name] (class) <x pos, y pos, width, height>css(property:value;)
component


```
comp_nameはブロックのIDとして/[A-z0-9-_]+/。classはcssのためのクラス名。positionは自動的に設定される。

新たにwidth, heightの指定が可能に。さらにcssもeditorから直接読み込み。

```
// 例：cssを直接指定して変更。
[testBox] <1,1,100,50>css(background:black;border:3px solid grey; color:white; border-radius:15px;  box-shadow:none;text-align:right;z-index:10;)
TestBox
```

![2018-01-11 21 06 00](https://user-images.githubusercontent.com/18391019/34824794-4310a02c-f713-11e7-96a3-a27042e17eb4.png)

参考：[スタイルシート（css）プロパティの一覧](http://www.tagindex.com/stylesheet/properties/)； vertical-alignは今回は使用不可(block要素なため)


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
gene_nameはブロックのIDとして/[A-z0-9-_]+/。classはcssのためのクラス名。

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

リンクに遺伝子情報を記載。[]と()の間に"u", "d", "l", "r"で、plotする位置を指定。
デフォルトは中央。

```
// 例: gene positionのuとdを使って相互に矢印
[c1] <1.5,27>
Glycerol
=[g1]d(l_w3)=>[c2]
<=[g2]u=[c2]

[c2] <13.5,27>
 G3P
```
![2018-01-11 23 43 41](https://user-images.githubusercontent.com/18391019/34831104-4d6aefee-f729-11e7-99fc-1677a829206d.png)

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

## Tips

### gene like box; class: gene

遺伝子を掴んで矢印を動かしたい場合、1つの化合物から大量に矢印が出る場合に利用。
```
//例：同じ化合物から同じ化合物に3つの矢印。
[genebox1] (gene) <7,32>
geneInfo1
l==d[c1]
==>d[c2]

[genebox2] (gene) <7,34>
geneInfo2
l==d[c1]
==>d[c2]

[genebox3] (gene) <7,36>
geneInfo3
l=(l_w1)=d[c1]
==>d[c2]
```

![2018-01-11 20 53 32](https://user-images.githubusercontent.com/18391019/34824395-98f700f0-f711-11e7-9bb4-9702ff4ff8ad.png)


### class: trans & transB

背景のないBoxを作成。メモ・脚注などに使用。
また、transBでborderありのブロック。

```
// 背景無し
[memoTest] (trans) <3,42.5>
メモ、脚注として使用

[memoTest2] (transB) <3.5,44>
Border付き

[memoTest3] (transB2) <10.5,44>
Border付き2

[memoTest4] <18.5,44>css(background:none; border:4px dashed #303F9F;box-shadow:none;)
cssだけで変更
```
[color](http://materialuicolors.co/)


### class: mark

![2018-01-11 18 48 12](https://user-images.githubusercontent.com/18391019/34819202-76b1b0a0-f700-11e7-87b5-1d108aac5497.png)
```
//画像の左から順に対応
//最小
[mark] (mark) <5,5,15,15>

[m2] (mark) <7,4,30,30>

//bortherの変更
[m3] (mark) <10,3,50,50>css(border:blue solid 4px; )

// そのまま
[m4] <15,3,50,50>
==>[m5]

// cssだけからmarkクラスを再現
[m5] <19.5,3,50,50>css(background:none;border:4px solid blue;border-radius:100px;box-shadow:none;z-index:20;)
```
使用例:markクラスによって、画像や文字に被せて表示可能(他の描画より上に来る為)

![2018-01-11 18 53 25](https://user-images.githubusercontent.com/18391019/34819323-c4d07064-f700-11e7-88e3-35263fd0232a.png)



# Copyright
Copyright 2016 tipputa


The original copyright for MarkDownDiagram: https://github.com/wakufactory/MarkDownDiagram

Copyright 2016 Wakufactory 
http://wakufactory.jp/ twitter:@wakufactory

License: MIT 
