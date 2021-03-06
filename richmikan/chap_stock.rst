在庫管理の章 ― truncateで在庫持出、echoで補充
======================================================================

注文を受けたものの実は在庫がなくて、お詫びと返金する羽目に……。
なんてことがあっては困る。

また、客Aが買おうとしていた時には商品があったけど、ゆっくり注文手続きをしていると、
猛スピードで客Bがやってきて買い占めていき、結局客Aにはお詫びと返金……、
ということがあっても困る。しかし、Webショッピングでは
「レジの順番待ち」という概念が無いために、気をつけなければその危険性がある。

というわけで、そうならぬための在庫管理をどうするのかという話である。

在庫の持ち出しと補充、普通はどうやる?
----------------------------------------------------------------------

「注文が確定した時に、在庫数パラメーターを減らしたい」とか、
「商品を補充したので、在庫数パラメーターを増やしたい」と言った時、
さてお前たちならどう実装するか。

恐らくは、

1. 対象商品の在庫数が書いてあるファイルあるいはレコードをまずロックする。
2. 一旦現在の在庫数を読む。
3. 変更後の値を計算する。
4. その値を上書く。
5. ロックを解除する。

と答えるのではないか? うむ、普通の回答だな。


我々は、コマンド一発で済ませる!
----------------------------------------------------------------------

我々はそんな面倒臭いことはせん。先に在庫補充の方法を紹介してしまうが、
そんなものはコマンド一発で完了する。「何、そんな便利なコマンドがあるのか?」
と思うかも知れんが、 **そのコマンドとはechoコマンド** だ。

ある商品の在庫数を保持しているファイルが ``shoccar_1`` [#shoccar_spell]_ だったとして、
その商品を10個補充するとしたら、こう書いておしまいだ。

.. code-block:: bash

	$ echo -n 0000000000 >> shoccar_1


文字を10個、追記するのだ。

ちなみに、同人誌の規模ではほとんどその機会はないが、もし1000個追加するとしたら、
さすがに文字を1000個書くのは疲れるので代わりにこう書く。

.. code-block:: bash

	$ printf '%01000d' 0 >> shoccar_1


在庫追加は、店員の作業だからべつにCGIスクリプトにする間でもなく、
作業時にログインして、上記のコマンドを一発実行したらおしまいだ。

.. [#shoccar_spell] 言い忘れていたが、シェルショッカーの「ショッカー」の綴りは、SHOpping+CARtで“Shoccar”である。“c”がダブっているのは英語における発音上の事情による。


ファイルの中身ではなくてサイズを在庫数にしてるのか!?
----------------------------------------------------------------------

echoやprintfコマンド一発で済ませるこのやり方を見て、
中身ではなくサイズを在庫数にしていることに驚いたかもしれんが、そのとおりだ。

「でもそれはディスクの無駄遣いだろ!」と言いたいかもしれんが、冷静に考えてみろ。
その商品の在庫は1メガ個とか1ギガ個もあるか?
百歩譲って1ギガ個あったとしても **このテラバイト時代に「だからどーした?」** という話だ。
1ギガ個もの商品を扱うような巨大ストアなら、チリみたいなコストに過ぎんはずだ。


カーネルが同時アクセス衝突を回避してくれる
``````````````````````````````````````````````````````````````````````

ファイルサイズで管理すると何が嬉しいかといえば、
何といってもご覧のとおり、ロックという煩わしい作業から解放されるのだよ。

ターミナルを2つ開き、片方で次のコマンドを何回も実行し、

.. code-block:: bash

	$ printf '%04096d' 0 >> shoccar_1

その間にもう片方で、次のコマンドを実行したとして、

.. code-block:: bash

	$ echo -n 1 >> shoccar_1

ファイルサイズが各々の文字列長×実行回数の合計と食い違うことは **絶対に起こり得えない** 。
上記の4096(4キロバイト)というのは、今どきのファイルシステムにおけるブロックサイズであり、
この値以下のサイズのデータは必ずアトミックに書き込まれる。
つまり、一方が書き込んでいる最中に他が割り込む隙を与えられない程に一瞬で終わるということであり、
**原理的にデータの書きこぼしが発生しない** のだ。

これはカーネルの特性を上手に利用していると言える。

	**プログラマーはもっと、カーネルの特性を知り、活用すべきだ!**

と言いたい。高級言語に頼ることばかり考えずにだ。
なにせ、カーネルの性質を素直に利用すれば、必然的に軽量・高速なコードが書けるのだからな。

在庫数一覧も、lsコマンド一発で
``````````````````````````````````````````````````````````````````````

在庫数をファイルの中身ではなくサイズで管理しているということは、
在庫数一覧も ``ls`` コマンド一発で調べられるということを意味している。

全ての商品の在庫数ファイルを格納しているディレクトリーが ``STOCK`` という名前だったとすると、
全商品の在庫数は次のようにすれば一発でわかる。

.. code-block:: bash

	$ ls -l STOCK

もしタイムスタンプ等の他のフィールドが邪魔ならば、``AWK`` コマンドあるいは ``self`` (Tukubaiコマンド) [#self_man]_ を使って
必要なフィールドだけ取り出せばよい。次の例は、商品ID(ファイル名)と在庫数だけ抽出する例だ。

.. code-block:: bash

	$ ls -l STOCK | tail -n +2 | awk '{print $9,$5}'      # AWKコマンドを使う場合
	
	$ ls -l STOCK | tail -n +2 | self 9 5       # self(Tukubai)コマンドを使う場合

なぜ ``tail`` コマンドが入っているかと言えば、ls -l実行時の1行目に ``total n`` という、ファイル名でない行が現れるのでそれを取り除くためだ。

そしてこの後、もし「必要な商品IDだけ」とか「在庫数が一定数以下のものだけ」という条件で絞り込みたければ、
その後にパイプで ``grep`` や ``AWK`` を繋げばよい。実に簡単だ。

.. [#self_man] ``https://uec.usp-lab.com/TUKUBAI_MAN/CGI/TUKUBAI_MAN.CGI?POMPA=MAN1_self``


在庫持ち出しは、truncateで
----------------------------------------------------------------------

在庫補充を先に解説したが、肝心なのは在庫持ち出しの方だ。
この場合はどうすればいいかというと、 ``truncate`` コマンドを使う。
例えば、在庫数ファイル ``shoccar_1`` から在庫を3つ減らしたい場合は次のように書く。

.. code-block:: bash

	$ truncate -s -3 shoccar_1

truncateコマンドとは、ファイルサイズを拡張したり切り詰めたりするものである。
ファイルサイズを絶対値指定することもできるが、+や-を付けて相対値指定することもできる。
相対値指定の場合、内部的には現在のサイズを調べてから変更後の絶対サイズを求めて
変更しており、理論的にはアトミックな動作ではないのだが、
サイズ調べてから変更するまでのステップが極めて短いため、実質的にアトミックと見なして問題が無い。

なので、在庫持ち出しもコマンド一発でできる……と、言いたいところなのだが
こちらはどうしてもロックが必要になる。

「10引く20が0」になってしまう
``````````````````````````````````````````````````````````````````````

理由は、truncateで変更前のファイルサイズを上回るサイズを減らそうとすると、
何のエラーも返さずにファイルサイズが0になってしまうからだ。
これはさすがに困るので、ロックして、ファイルサイズを調べて、
現在のサイズが減らしたい数以上あればtruncateを実施するようにしなければなない。

自作コマンドexflockを作った
``````````````````````````````````````````````````````````````````````

これはさすがに困ったので、ファイルロックを掛ける便利なコマンド ``exflock`` を自作した [#exflock]_ 。

FreeBSDやLinuxには ``lockf`` や ``flock`` といったファイルロック用のコマンドが存在するのだが
使い勝手がいまいち悪い。両者のコマンドが引数で指定したコマンドを呼び出し、
それが終わるまでの間しかファイルをロックしれくれない。
そうではなくて、ロックを掛けてそのまま次の処理へ進ませてくれるコマンドが欲しかった。

使い方はこんな感じだ。

.. code-block:: bash

	#! /bin/sh
	
	tmpfile=$(mktemp /tmp/${0##*/}.XXXXXXXX) # 一時ファイル
	[ $? -eq 0 ] || exit 1
	
	exflock /PATH/TO/TARGET_FILE > $tmpfile  # TARGET_FILEを排他ロックする
	[ $? -eq 0 ] || exit 1
	flockid=$(cat $tmpfile); rm $tmpfile     # 成功したらロックIDを変数に格納
	   :
	  (この区間で TARGET_FILE を独り占めできる。
	   従って、思う存分 truncate コマンドも使える)
	   :
	kill $flockid                            # ロックIDをkillするとロック解除
	                                 # (killしなくてもシェルスクリプト終了時に自動解除)

``exflock`` コマンドを実行すると、バックグラウンドで ``TARGET_FILE`` をロック(flock)したまま待機するプロセスを生成し、
そのプロセスIDを返しつつ、 ``exflock`` コマンドは終了する。
ただしこの時もファイルをロックするプロセスは生きているので、 ``exflock`` を実行したシェルスクリプトの中で好きにいじることができる。

ロックを解除したければ、そのプロセスIDをkillすればよいし、
killしなくても ``exflock`` コマンドを実行したシェルスクリプトが終了すれば(それを検知して)自動的に終了する。

.. [#exflock] シェルショッカー1号男のディレクトリー構成では、UTL/の中に収録してある。


実際の在庫持ち出し操作
----------------------------------------------------------------------

これらの知識を踏まえて、シェルショッカー1号男の中で在庫持ち出しを担当しているのが
SHELL/TAKEOUT_STOCKS.SHだ。コードを掻い摘んで見せてやる。

実際のコード(SHELL/TAKEOUT_STOCKS.SHから抜粋)
``````````````````````````````````````````````````````````````````````

.. code-block:: bash

	   :
	# --- 対象在庫数ファイル全てをロックする(ロックに失敗したらエラー終了) --- ←157行目あたり
	: > $Tmp-flockids
	for prodid in $(self 1 $Tmp-takingreqs); do
	  File="$Dir_STOCK/$prodid"
	  if [ \( ! -f "$File" \) -o \( ! -w "$File" \) ]; then
	    error_exit 6 "The stockqty file for \"$prodid\" is not found or unwrit
	able"
	  fi
	  exflock 5 "$File" >> $Tmp-flockids
	  [ $? -eq 0 ] || error_exit 7 "Failed to lock the stockqty file ($File)"
	done
	
	# --- 現在庫数表を作る ----------------------------------------- ←168行目あたり
	(cd "$Dir_STOCK"; ls -l) |
	tail -n +2               |
	self 9 5                 > $Tmp-stockqtys # 1:商品ID* 2:現在庫数
	   :
	   :
	# ここで一つでも在庫不足な商品があれば、在庫持ち出しはキャンセルする
	   :
	   :
	# --- 在庫を減らす ------------------------------------------- ←193行目あたり
	cat $Tmp-takingreqs |
	while read prodid quantity; do
	  File="$Dir_STOCK/$prodid"
	  truncate -s -$quantity "$File"
	done
	
	# --- 在庫数ファイルのロックを解除 ------------------------------- ←200行目あたり
	cat $Tmp-flockids  |
	while read pid; do
	  kill $pid
	done
	   :

このシェルスクリプトは、複数の商品在庫をまとめて持ち出すようになっていて、
1つでも不足しているものがあれば注文をキャンセルするという仕様である。

最初の部分では、とりあえず持ち出し対象のファイル全てに ``exflock`` コマンドでロックを掛け、
ロックプロセスIDを記録している。

その後、 ``ls`` コマンドで対象商品の在庫数を一括で調べ、全て足りていることが確かめられたら後半へ進む。

``truncate`` で1つずつ商品在庫を減らしていき、最後に記録していたロックプロセスIDを全て ``kill`` してロックを解除している。
