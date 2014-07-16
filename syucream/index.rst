今すぐ試そうHTTP/2
==================

こんにちは、 @syu_cream です。普段は某 web 系企業でバックエンドのシステムを支える裏方的な業務をしています。

本稿では、次世代 web プロトコルとして最近注目を浴びている HTTP/2 の、早くも存在している色々な実装についてつらつらと書いていきます。
HTTP/2 というプロトコル自体についての詳しい説明については本稿ではあまり触れません。その辺は既存の資料に丸投げさせて頂きます。
また、本稿の内容は旬の内容なので時間が過ぎれば役に立たなかったり事情が変わっている場合があります。ご了承ください。

はじめに
---------

HTTP/2 の簡単な説明
--------------------

概要
^^^^^

HTTP/2 は現在広く利用されている HTTP/1.1 のパフォーマンス面の課題を解消しつつ、 HTTP/1.1 とセマンティックを共有することでアプリケーションの実装を変更せずに済むことを念頭に置かれたプロトコルです。
HTTP/2 は Google の提唱した SPDY をベースに仕様策定が進められ、 2014 年 7 月現在で 13 番目のドラフトが発行されています。

既存の実装
^^^^^^^^^^

HTTP/2 の実装は既に世の中にいくつか存在します。
仕様自体にまだ Last Call がかかっていない都合、多くの実装が試験的に機能提供しているという状態です。

よく知られた実装については、 HTTP/2 の仕様策定について議論するための GitHub のリポジトリの Wiki に記載されています。 [*]_ 

.. [*] https://github.com/http2/http2-spec/wiki/Implementations

HTTP/2 実装を動かしてみる
--------------------------

ここでは HTTP/2 をサポートするサーバやクライアントの実装について簡単な説明と使用方法について述べます。

サーバを動かしてみる
^^^^^^^^^^^^^^^^^^^^^

nghttp2
""""""""

nghttp2 [*]_ は @tatsuhiro-t 氏によって開発が進められている C 実装の HTTP/2 ライブラリです。
HTTP/2 の仕様の変更に迅速に対応しており、仕様の網羅性も高い、 HTTP/2 実装の中でも抜きん出た存在と言えます。
また、 GitHub の nghttp2 リポジトリには後述の通りクライアントとサーバ、プロキシ、ベンチマークツールが存在します。

nghttp2 をビルドするのには幾つかの依存ライブラリを導入しなければなりません。
〜〜〜ここに Dockerfile について書く〜〜〜

nghttp2 サーバをインストールした後は、下記コマンドで実行できます。

::

   # http 通信のみの場合
   $ nghttpd --no-tls 8080

.. [*] https://github.com/tatsuhiro-t/nghttp2


Apache Traffic Server
""""""""""""""""""""""

Apache Traffic Server (以下、ATS)は Apache のトップレベルプロジェクトの一つとして開発が進められている、オープンソースのキャッシュ・プロキシサーバです。
ATS は現状正式に HTTP/2 をサポートしている訳ではないのですが、筆者に馴染み深いソフトウェアであり、かつ最近 HTTP/2  サポートに向けた活動が見られるので記述します。

ATS の HTTP/2 対応は、 ATS の開発を管理する JIRA 上のチケットで議論が進められています。 [*]_
初期は先述の nghttp2 を利用した HTTP/2 対応パッチが投稿されていましたが、議論の結果外部ライブラリに依存しない方針で対応を再検討されています。

nghttp2 を利用したパッチは現状でも動作は確認できます。
〜〜〜ここに Dockerfile について書く〜〜〜

.. [*] https://issues.apache.org/jira/browse/TS-2729

クライアントを動かしてみる
^^^^^^^^^^^^^^^^^^^^^^^^^^^

nghttp2
"""""""""

先述の nghttp2 はクライアントの実装も持っています。
nghttp2 をうまくインストールできている場合、下記のようなコマンドを実行することで HTTP/2 サーバと通信ができるはずです。

::

   $ nghttp -v http://localhost:8080/

-v オプションを付けることにより、 verbose モードでコマンド実行ができます。
この状態では下図に示す通り、送受信している HTTP/2 フレームの種類や内容、 HTTP レスポンスボディが確認できます。

Google Chrome Canary
"""""""""""""""""""""

Google Chrome Canary [*]_ は Google Chrome のナイトリービルド版のような立ち位置であり、実験的に搭載された数多くの機能を試すことができます。
HTTP/2 もこの実験的な機能に含まれており、設定を有効にすることで手軽に利用を開始できます。

Google Chrome Canary をダウンロードしたら、 chrome://flags にアクセスして試験運用機能の設定画面を開き、「SPDY/4 を有効にする」という項目を有効にしましょう。
これだけですぐに HTTP/2 通信が利用可能になります。

・・・とは言っても、これだけでは HTTP/2 通信できているかいまいち判別が付きません。
そこで SPDY indicator なる Chrome 拡張を導入してみましょう。
これを導入することで HTTP/2 通信が使用できている際に、下図のようにアドレスバーの右側に青い稲妻のアイコンが現れるようになります。


.. [*] https://www.google.com/intl/en/chrome/browser/canary.html

.. [*] https://chrome.google.com/webstore/detail/spdy-indicator/mpbpobfflnpcgagjijhmgnchggcjblin

Firefox Nightly Build
"""""""""""""""""""""""

Firefox Nightly Build [*]_ も Google Chrome Canary と同様、試験的に HTTP/2 をサポートしています。
こちらもデフォルトでは HTTP/2 が有効になっていないので、 about:config を開き network.http.spdy.enabled.http2draft と security.ssl.enable_alpn の設定値を true にしておきましょう。

.. [*] http://nightly.mozilla.org/

周辺ツールを使ってみる
^^^^^^^^^^^^^^^^^^^^^^^^

curl
"""""

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

Mac OS X を利用している場合、 Homebrew で HEAD 版を入れてしまうのが手っ取り早いかも知れません。

::

   brew install wireshark -HEAD

h2load
"""""""

まとめ
-------

