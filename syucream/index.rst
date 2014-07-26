今すぐ試そうHTTP/2
==================

はじめに
---------

こんにちは、 @syu_cream です。普段は某 web 系企業でバックエンドのシステムを支える仕事をしています。

本稿では次世代 web プロトコルとして仕様策定中である HTTP/2 の既に存在するいくつかの実装を、極力コストを掛けずに試してみるための方法について記述します。
表題の「今すぐ試そう」を実現するため、ソースコードのビルド手順などについて逐一記述することはせず、著者が作成した Docker イメージやパッケージを利用します。
また、本稿では HTTP/2 についての解説は本稿では最低限に留め、仕様の詳細にはあまり触れません。

HTTP/2 は現在仕様策定中であり今後仕様に変更が掛かる可能性があるため、本稿の内容は時間が経過してしまうと役に立たなかったり不要な情報となってしまっている場合があります。
あらかじめご了承ください。

HTTP/2 の簡単な説明
--------------------

HTTP/2 を試してみる前に、まず従来の HTTP/1.1 と比較した HTTP/2 のメリットについて記述します。

HTTP/1.1 の抱える課題
^^^^^^^^^^^^^^^^^^^^^^^

HTTP は今日の web を支える、クライアントとサーバの間でリソースを転送するためのプロトコルです。
HTTP は基本的にシンプルさを念頭に置かれて設計されており、リクエストラインやヘッダをテキストでやり取りする、リクエスト毎にTCPコネクションを張るなどパフォーマンス面では無駄の多いプロトコルといえます。

そこで現在広く使用されているバージョンである HTTP/1.1 [#]_ はそのようなパフォーマンス面の問題を解消するため、下記のようないくつかの機能追加がされています。

* KeepAlive
* Pipelining
* レンジリクエスト
* チャンク転送
* キャッシュ機構
* 転送エンコーディング

ここでは特に本稿の主題である HTTP/2 と関わりの深い、 KeepAlive と Pipelining についてピックアップします。

KeepAlive はTCPコネクションを複数のリクエスト処理で使い回せるようにするための機能です。
HTTP は先述の通り 1 つのリクエストを投げる毎にTCPコネクションを張り直し、レスポンスを受け切ったら切断します。これにより毎回 TCP コネクションを張るための 3ウェイハンドシェイクが発生し、レイテンシが増大してしまいます。
また TCP ではスロースタートと呼ばれる、輻輳を回避するためにコネクションを張った直後はウインドウサイズを低めに抑える仕組みを含んでいます。
さらに、 今日の多くのブラウザではサーバ側のリソースを食いつぶさないようにドメイン毎に TCP コネクションを 6 個までしか開きません。この制約は多数のリソースがあるようなページを閲覧する際にレイテンシの増大を引き起こしてしまいます。
これらの TCP とブラウザの性質により、 TCP コネクションを維持する KeepAlive はパフォーマンスの向上に大きく貢献できるといえます。

Pipelining は同時に複数のリクエストを投げる機能です。
HTTP リクエストは基本的に同期的に処理され、レスポンスが返ってきたら次のリクエストを投げる、という順序になるのですが、 Pipelining を行う際はレスポンスを待たずに次のリクエストを送ることができます。
Pipelining はサーバ側にリクエストを効率的に処理させることができ、また KeepAlive と同じくコネクション当りで処理できるリクエストが増えることによるパフォーマンスの向上が狙えます。

これらのパフォーマンスを改善する機能が盛り込まれた HTTP/1.1 ですが、その仕様 RFC2616 が公開された 1999 年と今日とでは事情が異なっており、現在の web でやり取りされるコンテンツの性質やハードウェア性能の向上に追従できているとはいえません。
具体的には下記のような性能面の懸念点が存在します。

1. HTTP/1.1 の Pipelining が抱える欠点
2. 冗長なリクエスト/レスポンスヘッダ
3. リソースの優先度を考慮しないレスポンス

1. の Pipelining の問題には、まず Pipelining によって処理されるリクエストの順序に起因するものがあります。
Pipelining ではリクエストを投げた順にレスポンスを処理する必要があるという制約が存在します。
このため、最初に投げたリクエストに関するレスポンスが返ってくるのに時間がかかった場合、後に続くレスポンスは待たされ続けてしまうという問題点があります。
この問題は Head-of-Line(HoL) Blocking と呼ばれます。 [#]_
その他にも Pipelining によって複数リクエストを投げた際にあるレスポンスに失敗するなどして TCP コネクションが切られた際、その他のレスポンスも巻き込まれ再送処理を余儀なくされる問題も存在します。

また、 2, に挙げた通り HTTP/1.x のリクエスト/レスポンスヘッダは冗長といえます。
ヘッダはテキスト形式でやり取りされ、圧縮などはされません。
User-Agent や Accept など毎回同じような値を送るヘッダも存在します。

更に、 3. に記述する通り HTTP/1.x では複数のリクエストを投げた際にその優先度を考慮しません。
現実の web ページには html や css, js などユーザに早く配信したいリソースが存在します。
これらのリソースを優先的に処理するようにできれば、ユーザ体験の向上に寄与できるはずです。

以上に挙げた通り、 HTTP/1.1 は現在一般的に使用されており、パフォーマンスを考慮した様々な機能を盛り込んでいます。
しかしながら不足している点も多々あり、 HTTP 自体のバージョンアップも強く望まれている状態といえます。

.. [#] http://tools.ietf.org/html/rfc2616

.. [#] 同様の問題が TCP のレイヤにも存在します。こちらはパケットの順序を守るため、パケットロスがあった際に続くパケットの処理がブロックされるというものです。詳しくはこちらを参照してみてください。 http://chimera.labs.oreilly.com/books/1230000000545/ch02.html#TCP_HOL

HTTP/2 のメリット
^^^^^^^^^^^^^^^^^^^

HTTP/2 はこれらの HTTP/1.1 のパフォーマンス面の問題点を解消しつつ、新たな機能を盛り込んだ次世代の web プロトコルです。
Google の提唱した SPDY をベースに仕様策定が進められ、 2014 年 7 月現在で 13 番目のドラフトが発行されている状態です。 [#]_ 

HTTP/2 の特徴として下記が挙げられます。

1. ストリーム（論理的なコネクション）によるリクエスト処理
2. HTTP ヘッダの圧縮
3. リクエストごとに優先度が設定可能
4. フローコントロール
5. サーバ側からの能動的なコンテンツ配信

1. のストリームによるリクエスト処理は、 HTTP/1.1 の pipelining の HOL Blocking を解消するために導入されています。
HTTP/2 は基本的にドメイン毎に1本のTCPコネクションを張り、その上に複数のリクエストを流すことで処理します。
また、リクエスト毎にストリームと呼ばれる論理的なコネクションを張り、その上でリクエストが処理されます。
ストリームにはそれぞれ一意のIDが振られ、どのリクエストがどのレスポンスに対応するか判別可能になっているため、 HTTP/1.1 で発生するような HOL Blocking が発生しません。

2. に書いた通り、 HTTP/2 では 独自の圧縮形式 HPACK [#]_ によって HTTP ヘッダを圧縮してやり取りします。
HPACK は よく使用される HTTP ヘッダ（ステータスコードの組み合わせや Content-Type など）をインデックスで指定可能にする、以前送ったヘッダをインデックスで再参照可能にする、ヘッダの名前と値をハフマン符号化するなどすることでサイズを削減します。

その他、 3. の通り HTTP/2 では先述のストリームに優先度を設定することが可能だったり、 
サーバ側でウインドウサイズを設定し、これを超えるリクエストをクライアント側で送らないようにすることで 4, のフローコントロールを実現したり、
クライアントからのリクエストに対してサーバがレスポンスを返すのでは無く、サーバが自発的にクライアントに必要だと思われるコンテンツを配信するサーバプッシュという機能がサポートされます。

.. [#] http://tools.ietf.org/html/draft-ietf-httpbis-http2-13

.. [#] http://tools.ietf.org/html/draft-ietf-httpbis-header-compression-07

HTTP/2 実装を動かしてみる
--------------------------

HTTP/2 は未だ仕様策定中で、仕様の修正も頻繁に入っている状態にありますが、既にいくつかの実装が存在し動作を確認することが可能です。
ただし仕様自体が固まりきっていない都合、多くの実装が試験的に機能提供しているという状態です。

よく知られた実装については、 HTTP/2 の仕様策定について議論するための GitHub のリポジトリの Wiki に記載されています。 [#]_ 

ここではいくつかの HTTP/2 実装を挙げて、実際に動かしてみるまでの手順について（なるべく楽に環境構築できるように）説明します。

.. [#] https://github.com/http2/http2-spec/wiki/Implementations

クイックスタート
^^^^^^^^^^^^^^^^^^

HTTP/2 を試してみたいけど、 HTTP/2 を解釈可能なサーバとクライアントを用意するのが面倒だというそこのアナタ！
ひとまずクライアントとして後述の Goole Chrome Canary もしくは Firefox Nightly Build を利用しましょう。
これらのクライアント実装はコンフィグ画面から HTTP/2 機能を ON にするだけで HTTP/2 リクエストを送ることができるようになります。

サーバについては、 https://Twitter.com/ にアクセスすることで代替しましょう。
twitter.com は既にプロダクションで HTTP/2 をサポートしており、実際に HTTP/2 を使って通信できます！

サーバを動かしてみる
^^^^^^^^^^^^^^^^^^^^^

nghttp2
""""""""

nghttp2 [#]_ は @tatsuhiro-t 氏によって開発が進められている C 実装の HTTP/2 ライブラリです。
HTTP/2 の仕様の変更に迅速に対応しており仕様の網羅性も高く、後述の curl, Wireshark でも使用されています。

GitHub の nghttp2 リポジトリにはクライアント (nghttp) とサーバ (nghttpd) 、プロキシ (nghttpx)、ベンチマークツール (h2load) が存在します。
./configure 実行時に --enable-app オプションを付与することでこれらがビルドされるようになります。
詳細なビルド方法については README の記述を参照してください。

またビルドするのが面等な方のために Dockerfile を用意しました。 docker build してご利用ください

::

   $ docker build https://raw.githubusercontent.com/syucream/h2dockerfiles/master/nghttp2/Dockerfile

nghttp2 サーバ(nghttpd)をインストールした後は、 nghttpd コマンドで実行できます。
証明書を用意するのが面等という場合は、 --no-tls オプションを付与することですぐに起動可能です。

::

   # http 通信のみの場合
   $ nghttpd --no-tls 8080

.. [#] https://github.com/tatsuhiro-t/nghttp2


Apache Traffic Server
""""""""""""""""""""""

Apache Traffic Server (以下、ATS)は Apache のトップレベルプロジェクトの一つとして開発が進められている、オープンソースのキャッシュ・プロキシサーバです。
ATS は現状では正式に HTTP/2 をサポートしている訳ではないのですが、筆者に馴染み深いソフトウェアであり、かつ最近 HTTP/2  サポートに向けた活動が見られているので記述します。

ATS の HTTP/2 対応は現在進行中です。 ATS の開発を管理する JIRA 上のチケットで議論が進められています。 [#]_
初期は先述の nghttp2 を利用した HTTP/2 対応パッチが投稿されており、仕様のドラフト番号 13 番で最低限の動作が確認できています。
（ただし現状では議論の結果、このパッチはマージされず外部ライブラリに依存しない方針で対応を再検討されています。）

本稿では上記パッチを当てた ATS を簡単に動作させるための Docker イメージを用意しました。
もし動作を確認してみたいとの要望が有りましたら、下記手順で ATS を動作させてみてください。

※ ATS は基本的にプロキシサーバとして動作するため、オリジナルのコンテンツを配信する HTTP サーバ（オリジンサーバ）が別途必要になります。
ここで紹介する Docker イメージでは nginx をオリジンサーバとして導入し、 nginx へリクエストを仲介するように ATS に設定追加を行っております。

::

   # docker pull
   $ docker pull syucream/h2ts

   # docker run して nginx と ATS を起動
   $ docker run -d -p 80:8080 -p 443:443 -t syucream/h2ts /bin/sh -c 'nginx && traffic_server'

上記コマンドで ATS を起動させた後は次節で紹介する HTTP/2 対応クライアントで通信してみてください。

.. [#] https://issues.apache.org/jira/browse/TS-2729

クライアントを動かしてみる
^^^^^^^^^^^^^^^^^^^^^^^^^^^

nghttp2
"""""""""

先述の通り、 nghttp2 はクライアントの実装 (nghttp) も持っています。
nghttp2 をインストールできている場合、下記のようなコマンドを実行することで HTTP/2 サーバと通信ができます。

::

   $ nghttp -v http://localhost:8080/

-v オプションを付けることにより、 verbose モードでコマンド実行ができます。
この状態では下図に示す通り、送受信している HTTP/2 フレームの種類や内容、 HTTP レスポンスボディが確認できます。

.. figure:: img/nghttp_verbose.eps

   nghttp で -v オプションを付与してリクエストを投げた際の出力

curl
"""""

curl では 7.33.0 以降から HTTP/2 リクエストが送れるようになりました。
--http2 オプションを付与することで HTTP/2 リクエストを送ることができます。
curl の HTTP/2 処理は nghttp2 を利用して実装されており、自前で curl をビルドする際には事前に nghttp2 をインストールしておく必要があることに注意してください。

curl についても本稿では Docker イメージを用意しました。
下記手順のように docker pull して試してみてください。

::

    # docker pull
    $ docker pull syucream/h2curl

    # コンテナ内に入る
    $ docker run -i -t syucream/h2curl /bin/bash

    # -v, --http2 オプション付きで HTTP/2 対応サーバにリクエストを投げる
    $ curl -v --http2 https://twitter.com/ > /dev/null

実際に curl で -v, --http2 オプションを付けてリクエストを投げた結果は下記のようになります。
使用プロトコルに h2-13 （HTTP/2 ドラフト番号13番）が選択されており、その後 HTTP/2 処理に関する出力がされていれば正常に HTTP/2 でリクエストを投げられています。

::

    # プロトコルネゴシエーション部分（一部抜粋） h2-13 が選択されている
    * SSLv3, TLS handshake, Client hello (1):
    } [data not shown]
    * SSLv3, TLS handshake, Server hello (2):
    { [data not shown]
    * NPN, negotiated HTTP2 (h2-13)
    * SSLv3, TLS handshake, CERT (11):
    { [data not shown]
    ...

    # レスポンスヘッダ一部抜粋
    < HTTP/2.0 200
    < cache-control:no-cache, no-store, must-revalidate, pre-check=0, post-check=0
    < content-length:54793

    # レスポンスのデータフレームの処理。ストリーム番号 1 で処理されているのが分かる。
    * http2_recv: 16384 bytes buffer
    * nread=18
    * on_data_chunk_recv() len = 10, stream = 1
    * 10 data written
    * on_frame_recv() was called with header 0
    * nghttp2_session_mem_recv() returns 18
    { [data not shown]
    * http2_recv: 16384 bytes buffer
    * nread=4096
    * on_data_chunk_recv() len = 4088, stream = 1
    * 4088 data written
    * nghttp2_session_mem_recv() returns 4096
    { [data not shown]

Google Chrome Canary
"""""""""""""""""""""

Google Chrome Canary [#]_ は Google Chrome のナイトリービルド版であり、実験的に搭載された数多くの機能を試すことができます。
HTTP/2 もこの実験的な機能に含まれており、設定を有効にすることで手軽に利用を開始できます。

HTTP/2 通信を有効にするには、 Google Chrome Canary をインストール後 chrome://flags にアクセスして試験運用機能の設定画面を開き、「SPDY/4 を有効にする」という項目を有効にしましょう。
これだけですぐに HTTP/2 通信が利用可能になります。

しかし HTTP/2 通信はユーザから見ると HTTP/1.1 と見た目上の差分はないため、これだけでは実際に HTTP/2 通信できているかいまいち判別が付きません。
そこで SPDY indicator  [#]_ という Chrome 拡張を導入してみましょう。
この拡張を導入することで HTTP/2 通信が使用できている際に、下図のようにアドレスバーの右側に青い稲妻のアイコンが現れるようになります。

.. figure:: img/chrome_canary_with_spdy_indicator.eps

   SPDY Indicator による HTTP/2 通信の確認

また、 chrome://net-internals/#spdy で現在張られている HTTP/2 （と SPDY ）セッションの情報を確認することもできます。

.. figure:: img/chrome_net_internals.eps

   HTTP/2 のセッション情報の確認

.. [#] https://www.google.com/intl/en/chrome/browser/canary.html

.. [#] https://chrome.google.com/webstore/detail/spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin

Firefox Nightly Build
"""""""""""""""""""""""

Firefox Nightly Build [#]_ は Firefox のナイトリービルド版であり、 Google Chrome Canary と同様試験的に HTTP/2 をサポートしています。
こちらもデフォルトでは HTTP/2 が有効になっていないので、 about:config を開き network.http.spdy.enabled.http2draft と security.ssl.enable_alpn の設定値を true にしておきましょう。

HTTP/2 通信できているか確認するには、 Firebug の Net タブから閲覧出来るレスポンスヘッダの内容からできます。
X-Firefox-Spdy ヘッダの内容に下図のような "h2-<ドラフト番号>" が含まれていれば HTTP/2 通信ができています。

.. figure:: img/x_firefox_spdy.eps

   X-Firefox-Spdy ヘッダの内容の例

.. [#] http://nightly.mozilla.org/

周辺ツールを使ってみる
^^^^^^^^^^^^^^^^^^^^^^^^

著名なネットワークユーティリティも HTTP/2 のサポートを開始し始めてみます。

Wireshark
""""""""""

みんな大好きネットワークアナライザの Wireshark も、開発版では HTTP/2 をサポートしています。
通常通り解析対象のインタフェースを選択し、フィルタとして "http2" を入力します。
するとアラ不思議！やり取りされている HTTP/2 フレームの種類とその内容が判別できます。

下図は実際に開発版 Wireshark で HTTP/2 フレームをキャプチャしてみた図です。
Magic Octet（HTTP/2通信開始時に送られる 24 ビットの固定の文字列）、 SETTINGS フレーム、 HEADERS フレームがやり取りされているのが分かります。
HEADERS フレームは HPACK という独自の圧縮形式で圧縮されているのですが、それをうまく展開し内容が確認できているのが分かります。

.. figure:: img/wireshark_dev.eps

   開発版 Wireshark で HTTP/2 フレームを覗き見ているシーン

Wireshark の HTTP/2 対応は残念ながら正式にサポートされている訳ではなく、利用したい場合は下記 URL の git リポジトリからコードを取得して自前でビルドする必要があります。

::

   https://code.wireshark.org/review/wireshark

Mac OS X を利用している場合、 Homebrew で HEAD 版を入れてしまうのが手っ取り早いでしょう。

::

   $ brew install wireshark -HEAD

h2load
"""""""

h2load は nghttp2 リポジトリに含まれる HTTP/2 と SPDY に対応したベンチマークツールです。
HTTP/1.1 のベンチマークツールとしては ab, http_load, weighttp などがありますが、 HTTP/2 に対応したベンチマークツールは現状 h2load のみです。

h2load は weighttp と似たようなオプションを持ち、これを使い慣れている方は違和感なく使用できると思います。
また、 HTTP/2 の特徴であるストリームの同時接続上限を指定して、複数ストリームでアクセスすることも可能です。

h2load も nghttp2 の Docker イメージを使用することで手軽に試すことができます。

::

   $ docker pull syucream/nghttp2

h2load に関しては、作者の @tatsuhiro-t さんが Qiita に投稿した解説 [#]_ があるので、これも合わせて読んでおくとよいでしょう。

.. [#] http://qiita.com/tatsuhiro-t/items/6cbe5b095e24d7feb381

また、 matsumoto-r さんによって執筆されたこの h2load を使って HTTP/1.1, SPDY/3.1, HTTP/2 の性能比較を行った記事も存在します。
HTTP/2 のベンチマークを行いたい際、こちらも参考にするとよいと思われます。

.. [#] http://blog.matsumoto-r.jp/?p=4079

まとめ
-------

HTTP/2 の実装を「今すぐ試す」方法、いかがでしたでしょうか。
本稿で HTTP/2 に興味を抱いて頂けたり、既存の実装を試して HTTP/2 導入のメリットを体感して頂ければ幸いです。

もし HTTP/2 の仕様について疑問がある、運用していくことを想定した際に不安な点があるなど気になった点がありましたら SNS やコミュニティ等でシェアしてみるのもよいと思います。
HTTP/2 は仕様の策定が GitHub 上で共有されており、議論に簡単に参加できるようになっています。 [#]_
日本でも http2 勉強会 [#]_ なる勉強会がたまに開催されており、 Twitter 上でも #http2study ハッシュタグ付きのツイートで気軽に情報が共有できます。

また、本稿で挙げた Docker イメージの元となる Dockerfile は GitHub で公開しています。 [#]_
なにかの参考にしたいという方がいらっしゃれば、参照してみてください。

それでは今後の web の発展を祈って。 Enjoy HTTP/2!

.. [#] https://github.com/http2/http2-spec

.. [#] http://connpass.com/series/457/

.. [#] https://github.com/syucream/h2dockerfiles

