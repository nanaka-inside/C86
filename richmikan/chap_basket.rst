買い物カゴの章 ― ddコマンドでCGI変数取得
======================================================================

商品ページを生成しないショッピングカートにとってのはじめの一歩、
それは買い物カゴを実装することだ。
じつはこの部分を作るだけでも、およそ一般のシェルスクリプトプログラムでは
やらないであろういろいろなことをやっている。
CGI変数の受け取りもシェルスクリプトではやらんだろう。まずはそこから教えてやる。

CGI変数はどうやって渡ってくるのか?
----------------------------------------------------------------------

「カゴに入れる」という動作を実現するにはまず、
Webブラウザーからカゴに入れたい商品と数量を教えてもらわねばならん。
Webブラウザーから情報を受け取るにはCGI変数を使えばいいわけだが、
シェルスクリプトでは一体どうやるのか?

CGI変数がWebサーバーにどうやって渡ってくるのかを知っていればある程度想像がつくはずなのだが。
しかし高級言語だと、CGI変数を読み取るためのライブラリーがあったりして各言語独自の方法で取り出すものだから、
CGI変数とは本来どのようにして送られてくるものなのか知らないという人間どもが多い。
私が言うのも何だが、お前たち **その言語に囲い込まれて洗脳されておるぞ** 。

よし、まずはその洗脳を解くために、仕組みを教えてやろう。

GETメソッドとPOSTメソッドがある
``````````````````````````````````````````````````````````````````````

Webブラウザー(クライアント)からWebサーバーに対してCGI変数を渡す方法に、
GETメソッドとPOSTメソッドがあることは知っているな。
したがって、送られ方は二通りある。

Webブラウザーはそのどちらかを選んで送ってくるので、
Webサーバー上のCGIスクリプトは、どちらが選ばれたかを調べねばならん。
(わかっているなら調べる必要はないがな)

それが書かれているのは、 ``REQUEST_METHOD`` という名の *環境変数* だ。
試しに、

.. code-block:: bash

	#! /bin/sh
	
	echo 'Content-Type: text/plain'
	echo
	echo "${REQUEST_METHOD}"


というCGIスクリプトをサーバー上で書いて、

.. code-block:: html

	<html>
	  <body>
	    <form method="ここにGETまたはPOST" action="上記CGIスクリプトへのURL">
	      <input type="text"   name="myname" value="shellshoccar" />
	      <input type="submit" name="button" value="submit!"      />
	    </form>
	  </body>
	</html>

というHTMLで呼び出してみるがいい。Webブラウザー上の ``submit!`` ボタンを押すと、
<form>タグのmethodプロパティーに書いた文字が ``GET`` だったらGETになるし、
``POST`` だったらPOSTになるはずだ [#contenttype]_ 。

この環境変数 ``REQUEST_METHOD`` がGETかPOSTかで、
次項で示すように二通りの取得方法を使い分けなけねばならないのだ。

.. [#contenttype] 今書いたCGIスクリプト、最初の2つの ``echo`` コマンドは画面に表示されていないな。この部分の話は今説明しているCGI変数の受け取り方を終えてから説明してやる。


GETメソッドの時は、環境変数 ``QUERY_STRING``
``````````````````````````````````````````````````````````````````````

GETメソッドの場合は環境変数 ``QUERY_STRING`` で渡ってくる。
従って ``echo`` コマンドあたりを使えばよいが、
外部から到来する文字列はどんな悪意に満ちたコードかわからんから
printfを使う方が安全だ。先程のHTMLのmethodを ``GET`` にし、
下記のCGIスクリプトを書いて呼びだしてみるがよい。

.. code-block:: bash

	#! /bin/sh
	
	echo 'Content-Type: text/plain'
	echo
	printf '%s' "${QUERY_STRING}"


すると、Webブラウザー上の ``submit!`` ボタンを押した後で

	``myname=shellshoccar&button=submit!``

と表示されたはずだ。（mynameとbuttonの順番は逆かもしれないぞ）

``QUERY_STRING`` に入っているとわかったらあとは簡単だ。次のコードを見よ。

.. code-block:: bash
	:linenos:

	#! /bin/sh
	
	Tmp=/tmp/${0##*/}.$$                         # 一時ファイル名のプレフィックス設定
	
	printf '%s' "${QUERY_STRING}" |
	tr '&' '\n'                   |              # 1行1変数化
	tr '=' ' '                    |              # 列区切り文字を半角スペースに
	cat                           > $Tmp-cgivars # 一時ファイルに保存
	
	echo 'Content-Type: text/plain'
	echo
	awk '$1=="myname"{print "私の名前は " $2;}' $Tmp-cgivars
	awk '$1=="button"{print "ボタン名は " $2;}' $Tmp-cgivars
	
	rm -f $Tmp-*                                 # 一時ファイル一括削除


まず、後でUNIXコマンドから利用しやすいように、
CGI変数を1行1変数化して更に区切り文字を半角スペース化する(6,7行目)。
そしてこれを一時ファイル [#tempfile]_ に格納してしまう(8行目)。
あとは、必要な時に、変数の値を取り出して利用するというわけだ(12,13行目)。

ただこのCGIスクリプトだと、変数の値がパーセントエンコーディング [#percent_enc]_ されていた場合に
そのまま表示されてしまうなど不十分な点があるが、後でsedやAWKを使ってデコードすりゃいいだけだ。
長くなるので具体的にどうやってデコードするのかについては割愛するがな。

そんなCGI変数のデコードまでをやってくれるコマンドがOpen usp Tukubaiで用意されていて、``cgi-name`` という [#cginame_man]_ 。
さらに、このCGIスクリプトではAWKで抽出していた各変数の抽出をやってくれるコマンドも用意されていて、 ``nameread`` という  [#nameread_man]_ 。
これらを使って書き換えると、こんな感じになる。

.. code-block:: bash

	#! /bin/sh
	
	Tmp=/tmp/${0##*/}.$$
	
	printf '%s' "${QUERY_STRING}" |
	cgi-name                      > $Tmp-cgivars # パーセントエンコードも解除して保存
	
	echo 'Content-Type: text/plain'
	echo
	echo "私の名前は" "$(nameread myname $Tmp-cgivars)"
	echo "ボタン名は" "$(nameread button $Tmp-cgivars)"
	
	rm -f $Tmp-*

.. [#tempfile]    シェルスクリプトを書くとき、一時ファイルは変数の如く、とにかく躊躇わず利用せよ。頻繁に読み書きしたとしても、今どきのUNIX系OSはバカじゃないので、キャッシュメモリで済ませようとする。従って大して遅くなりはしないのだよ。
.. [#percent_enc] 検索サイトで全角キーワードで検索した時、URLに出てくる ``%E3%81%82`` とかのアレだ。
.. [#cginame_man] ``https://uec.usp-lab.com/TUKUBAI_MAN/CGI/TUKUBAI_MAN.CGI?POMPA=MAN1_cgi-name``
.. [#nameread_man] ``https://uec.usp-lab.com/TUKUBAI_MAN/CGI/TUKUBAI_MAN.CGI?POMPA=MAN1_nameread``


POSTメソッドの時は、標準入力
``````````````````````````````````````````````````````````````````````

一方POSTメソッドの場合は標準入力から渡ってくる。
だが文字列の形式自体はGETの時と同じだ。
従って、単にCGIスクリプトの最初の部分を標準入力から読み込むように直せばよい。

.. code-block:: bash
	:linenos:

	#! /bin/sh
	
	Tmp=/tmp/${0##*/}.$$
	                                                 #   catではなくddコマンドで
	dd bs=1 count=${CONTENT_LENGTH:-0} 2>/dev/null | # ←読むのがポイント
	cgi-name                                       > $Tmp-cgivars
	
	echo 'Content-Type: text/plain'
	echo
	echo "私の名前は" "$(nameread myname $Tmp-cgivars)"
	echo "ボタン名は" "$(nameread button $Tmp-cgivars)"
	
	rm -f $Tmp-*


標準入力から読むなら ``cat`` コマンド……といきたいとこだが、安全のために ``dd`` コマンドを使う。
``cat`` コマンドを使うと、POSTメソッドで何も送られてこなかった場合に
一部の環境ではそこで入力待ちになって固まってしまう恐れがあるからだ。

そうならないようにするにはどうすればよいかというと、まず環境変数 ``CONTENT_LENGTH`` を参照する。
この環境変数にはPOSTメソッドで渡ってくるデータのサイズが入っているのだ。
こいつを確認し(もし ``CONTENT_LENGTH`` 自体も空なら0とし)、絶対固まることのないようにしている(5行目)。

その先は、GETの時と全く同じだ。
こうやって、CGI変数で渡ってくるカゴ入れ商品と数量をWebブラウザーから受け取るのだ。


ブラウザへの応答はどう返せばいいのか?
----------------------------------------------------------------------

CGI変数でカゴに入れたい商品とその数量を受け取ったら、
カゴに入れることができたかどうかをWebブラウザーに返答しなければならん。
「そんな商品ありませーん」とか「その商品はもう売り切れでーす」といったことがあるからな。
シェルショッカー1号男は、カゴ入れの成否を単に1か0かで返しているのだが、
どうやってWebブラウザーにその応答をしているのかという説明をしていなかったな。

標準出力に書く内容が素直に送り出される
``````````````````````````````````````````````````````````````````````
さっきのGET,POSTのところで例示したCGIスクリプトを見てもわかるように、
Webブラウザーへ情報送る時には標準出力にその内容を書き出せばよい。
他の言語も全て内部ではそうしていて、書いた内容がそのままWebブラウザーに送られる。
仮に画像ファイルを ``cat`` コマンドで書き出したとしたら、
Webブラウザーはその画像ファイルをダウンロードさせられることになる。

じゃあ、"Content-Type"とかは一体何?
``````````````````````````````````````````````````````````````````````

しかしGET,POSTのところで例示したCGIスクリプトを見直すと

.. code-block:: bash

	         :
	         :
	echo 'Content-Type: text/plain'
	echo
	echo "私の名前は" "$(nameread myname $Tmp-cgivars)"
	echo "ボタン名は" "$(nameread button $Tmp-cgivars)"


というように、必ず最初におまじないのような ``echo`` コマンドが2つ書いてあった。
そしてこれはWebブラウザーの画面には表示されなかったのだが、一体何の意味があるのか。

じつはファイル本体を送る前に、標準出力に対してHTTPヘッダーというものを送っておかねばならん。
このヘッダー部分も殆どそのままWebブラウザーに送られるのだが、Webブラウザーは制御情報として扱うのだ。

具体的にこのHTTPヘッダー部分で何を送るかといえば、最低限必要なのはこれから送るファイルの種別だ。
それが"Content-Type: ～"である。この"～"の部分を例えば"text/html"にすれば、
WebブラウザーはHTMLファイルと解釈して画面表示するし、"image/jpeg"にすればJPEG画像ファイルであると解釈して画面表示するし、
"application/octet-stream"と書けば、ダウンロードダイアログを出して「名前を付けて保存」しようとしたりする。
もし画像ファイルを送る時に"text/html"などと書いたら、画像ファイルをテキストエディターで開いた時と同様に恐らく文字化けした画面が表示される。

また、HTTPヘッダーで伝えられる内容は他にもある。
例えばHTTPステータスコード(404とかああいうヤツ)だ。
それを利用するとこんなCGIスクリプトも作れる。

.. code-block:: bash

	#! /bin/sh

	cat <<HTTP
	Status: 404 File Not Found
	Content-Type: text/html; charset=UTF-8
	
	<html>
	<head>
	  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	  <title>404 ファイル抹殺済</title>
	</head>
	<body>
	  <h1>よん・まる・よん！</h1>
	  <p>このファイルは我々が抹殺した! by シェルショッカー</p>
	</body>
	</html>
	HTTP

Statusヘッダーを付けてブラウザーに404(File Not Found)を知らせつつ、
オリジナルの404メッセージを作るというわけだ。

それから、Content-Typeと同様、HTTPヘッダー部の最後には必ず空行を1つ付けなければならない。
空行をもってHTTPヘッダー部の終了と見なすからだ。
そして **その次の行から** がファイル本体と見なされる。

カゴ入れの成否なら"Content-Type: text/plain"でよい
``````````````````````````````````````````````````````````````````````

商品をカゴに入れることの成功・失敗を返す場合、HTTPヘッダーには"Content-Type: text/plain"さえあればよい。
まあ、実際のシェルショッカー1号男はWebブラウザーやプロクシにキャッシュされないようにするために

.. code-block:: bash

	Cache-Control: private, no-store, no-cache, must-revalidate
	Pragma: no-cache


というヘッダーも付けているのだがな。


訪問者一人一人に「カゴ」を与えるには?
----------------------------------------------------------------------

商品をカゴに入れる際、訪問者一人一人にカゴを用意して、状態を記憶させなければならない。
Webアプリ的に言えば、 **セッションファイル・セッション管理** である。

これもまた、大抵の言語にはライブラリーがあって専用の操作をするわけだが、
その裏側では、次のようなことを行っている。

1) WebブラウザーからセッションIDの入ったCookieを受け取る。
2) もし受け取れなければ、セッションIDを新規発行する。
3) そのセッションIDに紐づいたファイルを取り出す or 新規作成する。
4) 必要な情報をそのファイルに書いたり、読んだりして……
5) WebブラウザーにセッションIDの入ったCookieを喰わせる。

というわけで、ここでキモになるのはCookieとセッションIDの発行だ。

Cookieを喰わせて回収するのはどうやるか?
``````````````````````````````````````````````````````````````````````

WebブラウザーからのCookieを回収するのは環境変数 ``HTTP_COOKIE`` を読み出して行う。
一方、Webブラウザーへ喰わせるのはHTTPヘッダー部分に ``Set-Cookie`` ヘッダーを付けて行う。

次のCGIスクリプトは、Cookie回収と喰わせのサンプルである。
このCookieはWebブラウザーを閉じるまでの間有効であり、
Webページをリロードすると最初にセッションが作成された日時を返すようになっている。

.. code-block:: bash
	:linenos:

	#! /bin/sh

	Tmp=/tmp/${0##*/}.$$
	
	printf '%s' "${HTTP_COOKIE:-}"   |             #・クッキーを回収する
	sed 's/[;,[:blank:]]\{1,\}/\&/g' |             #・Cookieの区切りは";"なので
	sed 's/^&//; s/&$//'             |             #  "&"に替えてCGI変数互換にする
	cgi-name                         > $Tmp-cookie #・あとはCGI変数と同様に扱える
	
	sessionid=$(nameread sessionid $Tmp-cookie |
	            tr -Cd '0-9A-Za-z_'            )   # このtrはセキュリティー確保の為
	if [ -n "$sessionid" ]; then
	  Sessionfile=/tmp/sessionfile.$sessionid
	else
	  Sessionfile=$(mktemp /tmp/sessionfile.XXXXXXXXXXXXXXXX)
	  date '+This session started at %Y/%m/%d-%H:%M:%S' > $Sessionfile
	fi

	echo 'Content-Type: text/plain; charset=UTF-8'  #  Cookieを
	echo "Set-Cookie: sessionid=${Sessionfile##*/}" #←Webブラウザーに喰わせる
	echo
	echo "Your session ID is ${Sessionfile##*/}."   # セッションIDを表示
	cat $Sessionfile                                # セッション開始日時を表示

	rm -f $Tmp-*


ここでもう一つ重要なのが、``mktemp`` コマンドだ。
他と被らないようなランダムな文字列を発行し、なおかつ一意なファイルを生成するという機能を持ってるから
セッションファイル作成にはもってこいだ。
mktempの第一引数では生成するファイルのテンプレートを指定することができ、
テンプレートの後尾の文字"X"がランダムな文字列に置き換わる。
ただし、セキュリティー確保のためには"X"は十分長くすることという注意書きがmanには書いてあるぞ。

実際のCookieには有効期限設定をしたりと、もう少し複雑な作業が必要になるが、長くなるので割愛する。
詳しく知りたくば、「シェルスクリプトによるCGIのセッション管理@Qiita [#cookie_qiita]_ 」を参照するがよい。

そして、さすがにセッション管理の作業を毎回記述するのは大変なので我々は独自のコマンドも作った。
Cookie文字列を発行する ``mkcookie`` コマンド [#mkcookie]_ と、
セッションファイルの管理をする ``sessionf`` コマンド  [#sessionf]_  だ。

.. [#cookie_qiita] http://qiita.com/richmikan@github/items/ee77911602afc911858f
.. [#mkcookie]     https://github.com/ShellShoccar-jpn/shellshoccar1/blob/master/public_html/CART/UTL/mkcookie
.. [#sessionf]     https://github.com/ShellShoccar-jpn/shellshoccar1/blob/master/public_html/CART/UTL/sessionf


他人のサイトも改造する、サードパーティーCookie!
----------------------------------------------------------------------

お前たちは *サードパーティーCookie* を知っているか?
例えこの言葉を聞いてことが無くとも、この技術がもたらす恐るべき洗脳工作は既に体験しているはずだ。
この図(Figure2.6)を見よ。

.. figure:: images/3rdpartycookie_outlined.eps
   :width: 141mm

   インターネットでよくある洗脳工作


例えば、あるショッピングサイトで人には知られたくない萌え萌えフィギュアを買った、あるいは買おうとしたけど思いとどまってやめたとしよう。
この時すでに恐るべき洗脳工作は始まっているのだ。
その後お前たちが全く関係無いサイトを訪れても、訪れたサイトに広告スペースがあると
その全く同じ萌え萌えフィギュアの広告が、まるで罰ゲームのように表示されることがあるだろう。
買ってないならまだしも、例え買っても全く同じもの広告されるのだから、罰ゲームとしか言いようがない [#ad_batsu_game]_ 。
あの工作で用いられているのが、サードパーティーCookieという機能だ。

仕組みはこうだ。
まず、お前たちが萌えショップサイトで買い物なり物色をする。
すると大抵お前たちのWebブラウザーは、お前たちを特定するためのCookieを喰わされることになる。
普通ならそのショップサイトから喰わされるのだが、裏で共謀する広告業者サーバーから喰わされる点がちょっと違う。

そしてその後、何も関係無いサイト(ニュースサイトなど)を訪れた時、
その関係無いサイトを見ている裏でお前たちのWebブラウザーは、またしても広告業者サーバーとCookieをやりとりさせられるのだ。
すると、お前たちの購入履歴や物色履歴を知っている広告業者サーバーは、
購入あるいは物色した商品をその関係無いサイトの広告欄に表示する、というわけだ。

このように、今訪れているサイトとは別のサイトとやりとりするCookieのことを
サードパーティーCookieという。

.. [#ad_batsu_game]       消耗品ならいざしらず、一度買った同じものを買うかっつーの! 観賞用、保存用、交換用で3つ買えとでも?


世界中のサイトにカゴ入れボタンを仕込む
``````````````````````````````````````````````````````````````````````

ここまでの話を聞いて我々の意図が汲み取れたかな?

そうだ! 我々のショッピングカートの買い物カゴCookieを、世界中のサイトで共有させてしてしまうのだ。
我々の組織とは全く関係無いブログページに置かれたナゾの買い物ボタン……。
そのブログサイトの常連のお前たち。「あれ、この人商売始めたのかな?」と思いつつも、
ブログ記事に感銘を受けてついつい「買い物かごに入れる」ボタンをポチリ。
その瞬間、我々が用意した真のショピングサイトと裏でAjax通信を始め、
我々の買い物カゴに紐付けられたCookieを喰わされる。

あとはお前たちが、そのことに気付かぬままレジへ移動し、ポチる(購入する)のを待つばかり。
このようにして我々は世界中のWebページを侵略しながら、じわりじわりと世界征服していくのだ。

世界中のサイトにカゴ入れボタンを仕込む
``````````````````````````````````````````````````````````````````````

さて、具体的にそれをどーやって実現するかだが、わかってしまえば大して難しいものではない。
普通のAjax通信に対し、サーバー側は2つのHTTPヘッダーを追加してWebクライアントに送り返すだけだ。

ユーザーがカゴに入れるボタンを押し、WebブラウザーがAjaxによるHTTPリクエストを発すると、
我々のサイト(ユーザーが見ているサイトではない)にこのようなHTTPヘッダーが送られてくる。

.. code-block:: text

	Accent-Encoding: gzip,deflate,sdch
	Connection: keep-alive
	Content-Type: application/x-www-form-urlencoded; charset=UTF-8
	   :
	Origin: http://invaded-site.com
	   :


ここで ``Origin`` というヘッダーが重要だ。「ユーザーが見ているサイトはここだよ」と我々に通知している。
このヘッダーは環境変数 ``HTTTP_ORIGIN`` で確認することができる。

そしてその ``HTTTP_ORIGIN`` の値が、確かに自分が改造したWebページのものであるならば、
次のようなレスポンスヘッダーを返せばよいのだ。

.. code-block:: text

	Content-Type: text/html
	   :
	Access-Control-Allow-Origin: http://invaded-site.com
	Access-Control-Allow-Credentials: true
	Set-Cookie: hogecookie1=foo; expire=Sun, 17-Aug-2014 07:00:00 GMT
	Set-Cookie: hogecookie2=var; expire=Sun, 17-Aug-2014 07:00:00 GMT
	   :


``Access-Control-Allow-Origin`` というのは、「このサイト(侵略先サイト)とAjax通信を許可する」という意味で、
``Access-Control-Allow-Credentials`` は「そのサイトがCookieを保管することを許可(true)する」という意味だ。
この2つを付けさえすれば、 ``Set-Cookie`` ヘッダーで指定したCookieを、
相手のWebブラウザーはまんまと保管してくれるわけだ。

Ajaxによる買い物カゴの実際
----------------------------------------------------------------------

これらの方法・コマンドを駆使して制作した、実際のカゴ入れプログラムがCGI/ADDTOCART.AJAX.CGIだ。
名前にあるとおりAjaxで駆動される方式をとっている。

訪問者が商品ページに設置されている「カゴに入れるボタン」を押した瞬間、
Webブラウザー上でJavaScriptが動き、商品IDと数量をPOSTメソッドで添えながらADDTOCART.AJAX.CGIを呼び出す。
Webサーバーはその成否を0または1の文字列でWebクライアントに返し、もし成功だったなら、
Webブラウザーは追加後の数を画面に反映させる。

大抵のショッピングカートだと、カゴに入れた途端にカゴの中身を確認するページへ移動するが、
アレはウザいと思ったのでやらないようにしている。それゆえAjaxが必要だったのだ。


実際のコード(CGI/ADDTOCART.AJAX.CGI、抜粋)
``````````````````````````````````````````````````````````````````````

ここまでの解説を見ながら眺めてみよ。

.. code-block:: bash

	    :
	# --- CGI変数(POST)を取得 ----------------------------------- ←145行目あたり
	dd bs=${CONTENT_LENGTH:-0} count=1 2>/dev/null |
	sed 's/+/%20/g'                                |
	cgi-name                                       > $Tmp-cgivars
	    :
	
	    :
	# --- Cookieを取得 ------------------------------------------ ←193行目あたり
	printf '%s' "${HTTP_COOKIE:-}"   |
	sed 's/&/%26/g'                  | #・Cookieでは&はエンコードされてない場合があり
	sed 's/[;,[:blank:]]\{1,\}/\&/g' | #  CGI変数的には問題なのでエンコードしておく
	sed 's/^&//; s/&$//'             |
	cgi-name                         > $Tmp-cookie
	
	# --- visitorid(セッションIDに相当)に基づきセッションファイル確保 ----
	visitorid=$(nameread visitorid $Tmp-cookie | tr -Cd 'A-Za-z0-9_.-')
	File_session=$(sessionf avail "$visitorid" "at=$Dir_SESSION/XXXXXXXXXXXXXX
	XXXXXXXXXX" lifemin=$COOKIE_LIFELIMIT_MIN)
	[ $? -eq 0 ] || errorcode_exit 'cannot_create_session_file'
	exflock 10 "$File_session" > $Tmp-sessionfilelockid # 多重アクセス防止
	if [ "$visitorid" != "${File_session##*/}" ]; then
	  newsession='yes'
	  visitorid=${File_session##*/}
	fi
	    :
	
	    :
	# --- Cross-Origin Resource Sharing 対応 -------------------- ←237行目あたり
	# 環境変数HTTP_ORIGINと等しい文字列の行が ALLOWED_ORIGIN_LIST.TXT の中にあったら
	# CORSに対応した2つのHTTPヘッダーを生成する
	cors=''
	cat $Homedir/CONFIG/ALLOWED_ORIGIN_LIST.TXT |
	env - sed 's/^#.*$//'                       | # コメント除去1
	env - sed 's/[[:blank:]]\{1,\}#.*$//'       | # コメント除去2
	grep -v '^[[:blank:]]*$'                    | # 空行除去
	awk '$1=="'"$(echo "_${HTTP_ORIGIN:-.}" | sed '1s/^_//' | tr -d '"')"'"{re
	t=1} END{exit 1-ret}'
	if [ $? -eq 0 ]; then
	  cors=$(printf '\nAccess-Control-Allow-Origin: %s\nAccess-Control-Allow-C
	redentials: true' "$HTTP_ORIGIN")
	fi
	    :
	# --- Cookieの寿命分だけ延長した日時を得る(dummy sessionでない時)-- ←259行目あたり
	if [ "_$visitorid" != '_.' ]; then
	  now=$(date -u '+%Y%m%d%H%M%S')
	  cookie_str=$(printf 'visitorid %s\ntimestamp %s\n' "$visitorid" "$now" |
	               TZ=UTC+0 mkcookie -e$now+$((COOKIE_LIFELIMIT_MIN*60)) -p/ )
	fi
	
	# --- HTTPヘッダー送信 -----------------------------------------------
	cat <<-HTML_HEADER
	  Content-Type: text/plain$cors$cookie_str
	  Cache-Control: private, no-store, no-cache, must-revalidate
	  Pragma: no-cache
	
	HTML_HEADER
	    :


1. カゴ入れリクエストをCGI変数から取得
2. 既に買い物カゴをもっていれば、そのIDをCookieから取得
3. 無ければ新規作成
4. サード―パーティーCookie発行のためのヘッダーを付加して、
5. Cookie文字列を生成し、
6. Webブラウザーに送る。

というわけだ。
