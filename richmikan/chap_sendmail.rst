メール送信の章 ― sendmailとnkfコマンドで何不自由なし
======================================================================

注文が成立したら、シェルショッカー1号男は顧客に注文明細と決済方法の案内を、
メールで通知する仕様にしている。
これはメールアドレスが本当に有効かどうかを確かめる意味もある。

というわけで、メールを送るという処理が必要になるわけだが、
これもやはりUNIXなら大抵の環境で備わっているコマンド ``sendmail`` で
かたが付く。

Cc:やBcc:を付けることも簡単だ。
ただ日本語やメールヘッダーの扱いがちょっと面倒だったので、
それを便利にするコマンドを例によって自作した。

というわけでこの章では、シェルスクリプトから日本語メールを送る話をしてやる。

sendmailコマンドの使い方
----------------------------------------------------------------------

はじめに、 ``sendmail`` コマンドの使い方を教えてやる。

いろいろな使い方があるが、次のやり方さえ覚えておけば十分だ。

1. 差出人(From:)や宛先(To:、Cc:、Bcc:)、件名(Subject:)などのメールヘッダーを付けたテキストファイルを用意する。
2. JIS(ISO-2022-JP)エンコードになっていない場合は、 ``nkf`` コマンド等でJISエンコードする。
3. ヘッダーの中に全角文字を使っている場合(From:、To:、Subject:など)は、その部分はさらにBase64エンコードする。
4. このテキストファイルを標準出力などで、 ``sendmail`` コマンドに送る。この時 ``sendmail`` コマンドには、必ず ``-i`` と ``-t`` オプションを付ける。

実際にsendmailコマンドを試してみよ
``````````````````````````````````````````````````````````````````````

簡単だから一度試してみるがいい。
まず、次のようなテキストファイル(mail.txt)を作る。
HTTPヘッダーとHTTPレスポンスの境界に空行が入っていたように、
メールにおいてもヘッダーと本文の境界に空行を1行置くというルールがある。

.. code-block:: text

	From: <your_address@example.com>
	To: <your_address@example.com>
	Subject: Hello, sendmail!
	
	わっはっは、世界征服だ!


ただし、少なくともTo:欄のメールアドレスにはお前たちの本物のアドレスを入れるようにな。
あと、From:欄もあまり適当なアドレスにするとspamとして弾かれるかもしれないから、
実在のアドレスを入れておいた方がいいぞ。

できたら、次のコマンドを実行してみろ。

.. code-block:: bash

	$ nkf -j mail.txt | sendmail -i -t

これでメールが届いているはずだ。どうだ、簡単だろう。

もし届いてなかったら、迷惑メール扱いされていないか、
またはそのホストは、そもそもメールを送れるホストなのか、/var/log/mail.logあたりを覗いて確認することだな。

ヘッダーで日本語を使うには一工夫要る
----------------------------------------------------------------------

さっきの例では、件名を "Hello, sendmail!" と英文にした。
ここを「こんにちは、sendmail!」などと日本語に変えて送ったらどうなるか、試してみるがいい。
きっと届いたメールの件名は文字化けしているはず [#subject_mojibake]_ だ。

これは、To:欄などを次のように書いても同様だ。

.. code-block:: text

	To: リッチ―大佐 <rich@shellshoccar.jp>

さっきも言ったがな、ヘッダー部分の全角文字はJISエンコードに加えてBase64エンコードすることと取り決められておる のだよ [#mail_header]_ [#emaillab]_。

.. [#subject_mojibake] 一部の気の利きすぎたメーラーだと、文字化けしないのだが……。
.. [#mail_header]      RFC 2047によればBase64の他にQuoted-Printableも認められている。またJISでなければならないとも記載されていないので例えばUTF-8を使っても間違いではない。しかし新旧多くのメーラーでの互換性を重視するなら、JIS+Base64にしておくのが無難だと思うぞ。
.. [#emaillab]         ``http://www.emaillab.org/essay/japanese-header.html`` も参照せよ。このサイトの情報は有用だ。

手作業でヘッダー部分をエンコードしてみよ
``````````````````````````````````````````````````````````````````````

それじゃヘッダー部分も正しく送る方法を教えてやろう。

まずは、nkfコマンドに ``-jMB`` というオプションを付けて、送りたい文字をエンコードする。

.. code-block:: bash

	$ echo -n 'こんにちは、sendmail!' | nkf -j mail.txt | awk 1
	GyRCJDMkcyRLJEEkTyEiGyhCc2VuZG1haWwh
	$ echo -n '人間どもよ' | nkf -j mail.txt | awk 1
	GyRCP000ViRJJGIkaBsoQg==

そこで生成されたそれぞれの英数文字列に対し、手前には ``=?ISO-2022-JP?B?`` という文字列を、
後ろには ``?=`` という文字列を付けたものをヘッダーに書けば完成だ。

こんな感じになる。

.. code-block:: text

	From: <your_address@example.com>
	To: =?ISO-2022-JP?B?GyRCP000ViRJJGIkaBsoQg==?= <your_address@example.com>
	Subject: =?ISO-2022-JP?B?GyRCJDMkcyRLJEEkTyEiGyhCc2VuZG1haWwh?=
	
	わっはっは、世界征服だ!


これをさっきと同じようにsendmailコマンドで送ってみろ、と言いたいところだが、
``nkf -j`` に通すとせっかく作ったBase64エンコードまで元に戻されてしまうので、
次のようにして本文だけをJISエンコードしたファイルを作ったうえで ``sendmail`` してみろ。

.. code-block:: bash

	$ head -n 4 mail.txt > newmail.txt
	$ tail -n +5 mail.txt | nkf -j >> newmail.txt
	$ cat newmail.txt | sendmail -i -t

今度はちゃんと件名が読めて、宛先は「人間どもよ」になってるはずだ。


sendjpmailコマンド
``````````````````````````````````````````````````````````````````````

今やった一連の作業を自動化した、 ``sendjpmail`` コマンドというものを作った。
シェルショッカー1号男では、UTL/ディレクトリーの中に収録している。

このコマンドには、メールヘッダーに全角文字を含ませたまま渡すことができる。
受け取ると、ヘッダー部分についてはJISに加えてBase64エンコードも施したうえで、
sendmailコマンドを呼び出す。


シェルショッカー1号男のメール送信
----------------------------------------------------------------------

シェルショッカー1号男は注文明細をメールで送ると言ったが、
次に掲載するテキスト(TEMPLATE.MAIL/ORDERED_PAYPAL.TXT)を
送信テンプレート [#mailtemplate]_ にしている。

送信メールのテンプレート(TEMPLATE.MAIL/ORDERED_PAYPAL.TXT、抜粋)
``````````````````````````````````````````````````````````````````````

.. code-block:: text

	From: シェルショッカー通販部 <tsuhan@example.org>
	To: <###inqEmail###>
	Bcc: tsuhan@example.org
	Subject: [shellshoccar通販] ご注文を承りました

	###inqName### 様


	この度は秘密結社シェルショッカーの商品をご注文いただきまして
	ありがとうございました。

	ご注文いただきました商品は下記のとおりであることをご確認ください。

	===RECEIPT===
	%2 %4円 %5 %6円
	===RECEIPT===
	  :
	  :

前章で、 ``fsed`` コマンドや ``mojihame`` コマンドを使ってHTMLに値をハメ込む話をしたが、
メールテキストでももちろんできる。これを実際にやっている部分が
注文確定時に動かすシェルスクリプト(CGI/ORDER.CGI)の中にある。

.. [#mailtemplate] テンプレートを見ると、Bcc:ヘッダーがあって自分に送っていることがわかるな。こうすれば、注文者に明細メールを送ると同時に、店員も注文が入った事実をメールで知ることができて便利だろ?

メール文面の作成と送信(CGI/ORDER.CGI、抜粋)
``````````````````````````````````````````````````````````````````````

.. code-block:: text

	   :
	# --- 注文明細を作る ----------------------------------------- ←303行目くらい
	# 1)メールテンプレから明細テンプレ区間(RECEIPT)を抽出
	sed -n '/RECEIPT/,/RECEIPT/p' "$mailtmpl" > $Tmp-receipttmpl
	# 2)項目名を作る
	echo '商品名 単価 数量 小計' > $Tmp-receipttext0
	# 3)明細をmojihame
	zcat "$File_session"                |
	$Homedir/SHELL/MAKE_RECEIPT.SH      |
	# 1:商品ID 2:商品名(mojihameエスケープ) 3:URL(無ければ"-") 4:単価 5:注文数 6:小計
	sed 's/\\\\/\\/g'                   |
	tr _ "$ACK"                         | # ketaコマンドで桁揃えするため
	comma 4 6                           | # mojihameで空白化されないようにする
	mojihame -lRECEIPT $Tmp-receipttmpl |
	awk '{$2=($2!="-円")?$2:"'"$ACK"'";$3=($3!="-")?$3:"'"$ACK"'";print}' >> $
	Tmp-receipttext0
	   :
	
	   :
	# --- メールテンプレに各種情報をハメる --------------------------- ←344行目くらい
	# 1)メールテンプレの明細テンプレ区間(RECEIPT)を清書したものに置き換える
	awk '/RECEIPT/{exit} {print}'         "$mailtmpl" >  $Tmp-receipttmpl2
	cat $Tmp-receipttext                              >> $Tmp-receipttmpl2
	awk '/RECEIPT/{n++;next} n>=2{print}' "$mailtmpl" >> $Tmp-receipttmpl2
	# 2)その他各種情報をハメる
	cat $Tmp-receipttmpl2                                      |
	fsed '###inqEmail###'  "$(nameread inqEmail $Tmp-inqvars)" |
	fsed '###inqName###'   "$(nameread inqNameFam $Tmp-inqvars) $(nameread inq
	NameGiv $Tmp-inqvars)" |
	sed  's/###ORDERID###/'"$orderid"'/g'                      |
	fsed '###PAYPALURL###' "$paypalcgi1url"                    > $Tmp-mailbody

	# --- メール送信 -----------------------------------------------------
	# 1)送信
	sendjpmail $Tmp-mailbody $Tmp-mailtmp
	   :


先のテンプレートの ``===RECEIPT===`` ～ ``===RECEIPT===`` の区間はmojihameコマンドで明細を貼り、
その他の ``###～###`` の箇所は ``fsed`` コマンドで顧客の名前やメールアドレス等を貼りつけている。
