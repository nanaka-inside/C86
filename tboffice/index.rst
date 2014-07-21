
***********************************************
Immutable Infrastructureの最適解を探る(chapter用)
***********************************************


Immutable Infrastructureの最適解を探る
=====================================

筆者の@tbofficeです。某webサービス的な会社でインフラ的なお仕事をやりつつ、裏では同人誌を書いています。本業が同人誌を書くことではないのかというツッコミを、最近受けるようになりました。おそらくそうなんじゃないでしょうか。それにしても、印刷代ってバカにならないですよね。何を言っているんでしょうかこの人は。

さて、本特集では、2014年のインフラ界のバズワードである「Immutable Infrastructure」(以下、IIと略します)について取り上げます。IIの由来や、動向とそれにまつわるソフトウエアを実際に使ってみたいと思います。


まず、こちらをご覧ください
-------------------------------

.. figure:: img/appprotweet.eps
  :scale: 70%
  :alt: appprotweet
  :align: center

  やめて！！

心臓に何かが刺さった音がしましたか？

次にこちらをご覧ください
----------------------

.. figure:: img/condel.eps
  :scale: 50%
  :alt: condel
  :align: center

  いつまで手動でデプロイしているんですか？

:: 

   ＿人人人人人人人人人人人人人人人人人人人人人人＿
   ＞　いつまで手動でデプロイしているんですか？　＜
   ￣Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y￣

マサカリが投げられましたね。この本については、後ほど触れることにしましょう。


あわせて読みたい
---------------

CHad Fowler氏 [#iichad]_ の「サーバを捨てて、コードを焼き付けろ！」 [#iitys]_ [#iitys2]_ というブログ記事があります。
その記事のJunichi Niino氏による邦訳 [#iihottan]_ を引用してみましょう。

  開発者として、あるいはしばしばシステム管理をする者として、これまで経験したもっとも恐ろしいものの1つは、長年にわたり稼働し続けてなんどもシステムやアプリケーションのアップグレードを繰り返してきたサーバだ。

  なぜか。その理由は、古いシステムはつぎはぎのような処置がされているに違いないからだ。障害が起きたときに一時しのぎのハックで対処され、コンフィグファイルをちょこっと直してやり過ごしてしまう。「あとでChefの方に反映しておくよ」とそのときは言うけれど、炎上したシステムの対処に疲れて一眠りしたあとでは、そんなことは忘れてしまうだろう。

  予想もしないところでcronのジョブが走り始めて、よく分からないけれどなにか大事な処理をしていて、そのことを知っているのは関係者のうちの1人だけとか。通常のソースコード管理システムを使わずにコードが直接書き換えられているとか。システムがどんどん扱いにくくなっていき、手作業でしかデプロイできなくなるとか。初期化スクリプトがもはや、思いも付かないような例外的な操作をしなければ動かなくなっているとか。

  もちろんOSは（きちんと管理されているならば）なんども適切にパッチが当て続けられているだろうが、そこには（訳注：やがて秩序が失われていくという）エントロピーの法則が忍び込んでくるものだし、適切に管理されていないとすればいちどもパッチは当てられず、もしこれからパッチを当てようものならなにが起きるか分からない。

  私たちはこの問題を解決するために何年ものあいだ、チームポリシーの策定から自動化までさまざまな方法を試してきた。そしていま試している新しい方法が「Immutable Deployments」（イミュータブル・デプロイメント）だ。

.. [#iichad] https://twitter.com/chadfowler
.. [#iitys] 邦題は@naoya氏の「Immutable Infrastructure Conference #1」の発言から引用
.. [#iitys2] 「Trash Your Servers and Burn Your Code: Immutable Infrastructure and Disposable Components」http://chadfowler.com/blog/2013/06/23/immutable-deployments/
.. [#iihottan] このへんの流れは、 Junichi Niino氏の「『Immutable Infrastructure（イミュータブルインフラストラクチャ）と捨ててしまえるコンポーネント』 チャド・ファウラー氏」http://www.publickey1.jp/blog/14/immutable_infrastructure.html　を参考にしました。っていうかほぼそのまま

どんどん変更を加えていったことによって、その全容を知る者がいなくなってしまったシステムの誕生です。
そんなシステムはデプロイ職人によってアップデートされることがあり、素人が触るとだいたい失敗します。


継続的デリバリー
---------------

先ほど、「いつまで手動でデプロイしているんですか？」というマサカリを投げてきた本は「継続的デリバリー 信頼できるソフトウェアリリースのためのビルド・テスト・デプロイメントの自動化」 [#iikz]_ (以下、「継続的デリバリー」と略します)です。この本は、ソフトウエアをユーザにできるだけ早く届ける方法が書かれています。つまり書いたコードのテストを自動で行うための手法から、本番環境への安全で素早いデプロイ方法などについて書かれています。

* 手動で変更を加えていったサーバのプログラムのアップデートを行うために、なぜ毎週、戦々恐々としなくてはならないのか？
* バグを出してしまったが、来週のアップデートまで待たせるのか？

本来は、バグを潰したコードを、すぐにでも本番サーバに安全にデプロイしたい、と思っているんじゃないでしょうか。そして、こう考えます。

手動で変更を加えていったサーバは壊そう！

.. [#iikz] http://www.amazon.co.jp/dp/4048707876


作って壊す、そして自動化
----------------------

Martin Fowler氏のブログに、PhenixServer [#iifs]_ という記事があります。不死鳥のように蘇るサーバという意味です。
お仕事で動作中のサーバの監査行ったとき、本番と同じサーバを作ろうとしたところ、構成のズレやアドホックな変更でサーバの設定が「drift」(漂流)していたそうです [#iisfs]_ 。
だったらいっそのこと定期的にサーバを焼き払ったほうがよく、puppetやchefを使ってサーバを作り直そうと書かれています。

.. [#iifs] http://martinfowler.com/bliki/PhoenixServer.html
.. [#iisfs] そんなサーバのことを SnowflakeServer(雪の欠片サーバ) という http://martinfowler.com/bliki/SnowflakeServer.html

あるいは、開発環境をいじくりまくって、やっぱりもとの綺麗さっぱりした状態にもどしたい、なんて経験は一回や二回、いやもっとあったかな？
そんなときに、もし作りなおすことが簡単にできたらどうでしょう。

ここで、先ほどでてきた「継続的デリバリー」の中でも重要な事として **自動化** が何度も登場します。
自動化を推し進めると、コードのテストから、バグの修正や機能の拡張を本番サーバにデプロイするまでがほぼ自動となり、デプロイの回数を安全に増やすことができます。

2012年に行われたカンファレンス、AWS re:Inventにて「Amazonは1時間に最大1000回もデプロイする」 [#iideploy]_ という講演がありました。
そのなかで、「Amazon.comでは11秒ごとに新しいコードがデプロイされている。そして最も多いときで1時間に1079回デプロイが行われた。
これには機能追加だけでなくバグフィクスなども含まれるが。平均で1万、最大で3万ものホストがデプロイを受け取る」とあります。
これは、バグはすぐに潰され、機能の追加の恩恵も受けられることを示します。このサイクルを行うために、継続的デリバリーでも強調されている **自動化** が必須となります。

例えば、この本の原稿の生成も自動化されています [#iikonohon]_ 。
githubにReST形式の原稿をpushすると、それを検知したjenkinsがsphinx [#iisphinx]_ のコマンドを実行し、入稿用のPDFが生成されます。

自動化の最先端として、githubにpull requestを行うとテストが実行され、そのあと本番環境へデプロイされる仕組みが@naoya氏のブログで紹介されています [#iighedep]_ 。
pull requiestをIRCなどのツールで自動化して作成し、Pull Request内容を確認、mergeするとそのままテストが走り、そして本番環境へコードが入ります。
自動化できるところは自動化しましょう。人的ミスがなくなります。

.. [#iideploy] http://www.publickey1.jp/blog/12/amazon11000_aws_reinventday2_am.html
.. [#iisphinx] ドキュメントビルダーのsphinxです。http://sphinx-users.jp/
.. [#iighedep] GitHub 時代のデプロイ戦略 http://d.hatena.ne.jp/naoya/20140502/1399027655
.. [#iikonohon] ななかInsidePRESS vol.1では原稿はGitHubにあり、PDFは手動でビルドしていました 
.. [#iivps] Virtual Private Server。仮想専用サーバのことです。この原稿PDFはさくらのVPSでビルドされています


そうはいっても
^^^^^^^^^^^^^^

確かに壊して作りなおすと言っても、いまさらできないよ・・・時間があればできるけど、それをやっている隙がないということもあるでしょう。
そいういう場合は、人間が毎回ルーチンで行っていることを自動化しましょう。たとえばコードのテストの自動化であったり、デプロイの準備などです。
いつか来る、すべてのシステムの作り直しの時がくるまでに準備しておきましょう [#souhaittemo]_ 。

.. [#souhaittemo] 作り直しの時がこないって？そんなシステムは老朽化がきて、サービスをやめようという判断になるので、そのまま捨てましょう（ぇー


サーバのセットアップの一般的手順
-----------------------------

IIの説明をするまえに、我々は何を自動化したいのかを明確にしておきましょう。例えばサーバのセットアップの一般的手順を示すと下記のようになります [#iisetup]_ 。

* データセンターにサーバを設置してケーブリング。またはインスタンスを立ち上げ
* OSをインストール [#iigoldenimage]_ 
* ミドルウエアをインストールして設定ファイルを書く
* プログラムをデプロイ
* プログラムの動作を確認
* 監視ツールに登録
* DNSに登録
* LBに登録

.. [#iisetup] Serf という Orchestration ツール #immutableinfra http://www.slideshare.net/sonots/serf-iiconf-20140325 の14ページを参考にしました
.. [#iigoldenimage] ゴールデンイメージってやつもあるけど各自ぐぐってね！


Immutable Infrastructure を導入
-------------------------------

いよいよ本題のIIに入ります。

IIの三層
--------

とっつきやすいのでIIの三層の話から入ります。mizzyさんの記事 [#iimi1]_ で三層の話がでてきます。この記事の参照先 [#ii3lay1]_ のPDF [#ii3lay2]_ を引用します [#ii3lay3]_ 。

.. [#iimi1] インフラ系技術の流れ - Gosuke Miyashita - http://mizzy.org/blog/2013/10/29/1/
.. [#ii3lay1] Provisioning Toolchain: Web Performance and Operations - Velocity Online Conference - March 17, 2010 - O'Reilly Media - http://en.oreilly.com/velocity-mar2010/public/schedule/detail/14180
.. [#ii3lay2] Open Source Provisioning Toolchain - http://cdn.oreillystatic.com/en/assets/1/event/48/Provisioning%20Toolchain%20Presentation.pdf
.. [#ii3lay3] このスライドは、もともとToolchainの話をしています。Toolchainとはソフトウエアを作る生産ラインみたいなものです。たとえば「emacs->autoconf->autoheader->automake->libtool->gcc->ld」

.. figure:: img/3layer.eps
  :scale: 50%
  :alt: 3layer
  :align: center

  IIの三層

サーバをセットアップする生産ラインとしてこの３つの層がでてきます。矢印の方向に向かって、ベルトコンベアのようにサーバがセットアップされる様子を表しています。

* Bootstrapping

  * OSのインストールやVM,クラウドのイメージの起動
  * 使われるツールやソフトウエア：Kickstart, Cobbler, OpenStack, AWS

* Configuration

  * ミドルウエアのインストールや設定
  * 使われるツールやソフトウエア：Puppet, Chef, AWS OpsWorks, Ansible

* Orchestration
  
  * アプリケーションのデプロイ
  * 使われるツールやソフトウエア：Fabric, Capistrano, MCollective

どの層で何をやるかは、正確な定義はないので好きなようにしましょう。使われるツールからやれることを想像してみてください。ただし、どの層で何をやるのか決めておかないと手間が増えます。たとえば、kickstartでOSのユーザを作って、さらにChefでも同じユーザを作ろうとしてレシピがコケるとか [#iisurf00]_ 。

.. [#iisurf00] Orchestrationからしれっと Surf を消してますが、まあ無視しましょう

以上は三層で終わっていますが、本誌ではそれに付け加えて２つの層を設定します。

* Test

  * デプロイされたプログラムの動作を確認
  * 使われるツールやソフトウエア：Serverspec

* Agent
  
  * 外部サービスに自分を登録
  * 使われるツールやソフトウエア：Serf

どうでしょうか [#ii]_ 。ここまでくると、先ほどの「サーバのセットアップの一般的手順」を網羅できましたね！ [#iitaechan]_ [#iiyarukoto]_

.. [#ii] このTestとAgentをOrchestrationに含めてもいいんですけどOrchestrationが頭でっかちになるんですよね [脳内調べ]
.. [#iitaechan] やったねタエちゃん、やること増えるよ！！
.. [#iiyarukoto] 初期コストかけて自動化の状態に持って行ってそこからあとは楽になる...と考えていた時期がありました(このへん、かなり大きな問題だったり...)


早速実践してみよう
----------------

そういえばサーバのセットアップの一般的手順で「データセンターにサーバを設置してケーブリング」を自動化してませんよね？えっ？GoogleかAmazonあたりが革新なソリューションを発表してくれることを期待してここでは放置しましょう [#iicable]_ 。

.. [#iicable] このへんのソリューションを作ったら売れそうな感じしますよね。ってかなんで21世紀になってサーバとスイッチを有線でつなぐの？ありえないんですけどーーぷんすか（落ち着いて下さい
.. [#iirack1] っていうかさーなんで21世紀になって電源タップからサーバに電源ケーブル繋がないといけないの？ケーブルが絡みついてあられもない格好に（なりません
.. [#iirack2] そもそもなんでサーバ設置しないといけないの？てかもう、サーバラックとサーバを一体型にしてデータセンターにポンを置けばもう使えるとかできないの？？
.. [#iirack3] ↑このシステム、売れそうな気がするんですけど誰かやってくれないですかねえ。あ、できたら筆者に分け前ください!!シクヨロ!!

さて、IIの三層+二層をひと通り実践してみましょう。Bootstrappingから始まると思った?残念!!Serverspecちゃんでした!! [#iizansaya]_ 

.. [#iizansaya] 残念さやかちゃん。まえがきでこのネタを使おうと準備してたけど結局使えなかったのでここで満を持して登場!!

なんでServerspecから始めるのかだって？それはそこそこ重要で取っ付きやすいからです。サーバのデプロイはchefでもAnsibleでもbashスクリプトでも手動でコマンドを打てば構築はできます。
問題はそのあとです。誰がどうやって、そのサーバが正しくセットアップできているか調べるのか？それにはServerspecを使いましょう。

.. topic:: とあるインフラのChef疲れ

   この本を作っている第七開発セクションが前回頒布した「ななかInside PRESS vol.4」でChefを特集しました。そのChefを執筆した人曰く、Chefのレシピを書くのが辛くなってきたそうです。
   社内でいろいろなプロジェクト(プロダクト)があります。それらに対応する汎用的なレシピを書くと、設定することが多くなり、扱いづらくなるという現象が起きました。

   そのため、すでにあるレシピをプロダクト担当のインフラの中の人が各自forkして使いやすいように手を加えました。構築に一回使うだけだしいいよね、ってことで一回だけ実行される死屍累々のレシピが作られていったそうです。おしまい。
   
   なお、この話はフィクションです。フィクションですよ！！大事なことなので二回言いました。


動作確認するためにServerspec
^^^^^^^^^^^^^^^^^^^^^^^^^^

Serverspec [#iiscurl]_ とは、ruby製のツールで、Rspec [#iirspec]_ を拡張したものです。ssh経由でOSの内部の状態をチェックすることができます。さっそく具体例を見ていきましょう。
Serverspecのチュートリアルをクリアするといくつかファイルが出来ます。そのとき、テストを記述するspecファイルもサンプルとして一緒に作成されます。

.. code-block::ruby

   require 'spec_helper'
   
   describe package('httpd') do
     it { should be_installed }
   end
   
   describe service('httpd') do
     it { should be_enabled   }
     it { should be_running   }
   end
   
   describe port(80) do
     it { should be_listening }
   end
   
   describe file('/etc/httpd/conf/httpd.conf') do
     it { should be_file }
     its(:content) { should match /ServerName www.example.jp/ }
   end

やってることはフィーリングでなんとかして下さい。え？なんとかならない？しょうがないにゃあ。このspecファイルは、httpdに関連したファイルで、パッケージがインストールされているか、httpdがOS起動時に起動しているか、プロセスが上がっているか、80番ポートをlistenしているかなどをチェックします。なお、localhostにsshで入れる設定であれば、自分自身もテストできます [#iijibun]_ 。

チュートリアルで作ったこのテスト(specファイル)は、1つのサーバに対応しています。複数のサーバをまとめてチェックするものがないかなーと探していたらありました [#iiscd]_ [#iiscdbun]_ 。使ってみましょう。

.. code-block:: sh

   $ git clone git@github.com:dwango/serverspecd.git
   $ cd serverspecd
   $ bundle

hosts.ymlにホスト名とチェックするrolesを書いて、attributes.ymlにroleに与えるパラメーターを書きます。
たとえば自分が所有しているvpsにテストをかけてみましょう。まずは、sshでノンパスで入るために ``.ssh/config`` を設定。公開鍵は別途登録して下さい。

.. code-block:: conf

   Host nico
     HostName        niko.example.com
     Port            2525
     User            nico_yazawa
     IdentityFile    ~/.ssh/id_rsa
     User            nico

attributes.yml.templateとhosts.yml.templateをリネームしてhosts.ymlを変更。こんな感じ。

.. code-block:: sh

   $ cp attributes.yml.template attributes.yml
   $ cp hosts.yml.template hosts.yml
   $ cat hosts.yml
   nico:
     :roles:
        - os
   maki:
     :roles:
        - os
        - network

設定を見てみましょう。サーバの一覧が並びます。

.. code-block:: sh

   % rake -T                              
   (in /home/chiba/repo/serverspecd)
   rake serverspec       # Run serverspec to all hosts
   rake serverspec:maki  # Run serverspec to maki
   rake serverspec:niko  # Run serverspec to niko

テスト実行してみます。成功したテストは ``.``  、失敗したテストは ``F`` で表示されます。失敗したテストの理由が表示されます。どんなコマンドを実行したか出るので、デバックするときに使います。

.. code-block:: sh

   $ rake serverspec:niko
   (in /home/chiba/repo/serverspecd)
   /usr/local/bin/ruby -S rspec spec/os/os_spec.rb
   .FFFFFFFFF..FF...F.F....FFFFFF........F.........FF..FF..FFFF....F....F..F.......FF....F...FFFFF......FFF
   
   Failures:
   (以下略)

なお、attributes.ymlのosのセクションにパラメータが、テストは ``spec/os/os_spec.rb`` にあります。phpやmysqlのテストも同梱したので、使いたい人は使ってやって下さい。

Serverspecで重要なのは、何をテストするかということです。なるべく重複するテストの数を少なくするのがおすすめです。これをチェックすれば、複数の項目がチェックできるテストが良いです [#iisstest]_ [#iisstest2]_ 。
応用としては、開発サーバや本番サーバのSAN値 [#iisanti]_ のチェックをしてみましょう。
具体的には、Jenkins [#iijenkins]_ おじさんを使って1日1回程度テストを回して、入ってはいけないパッケージを見つけたり、別のサーバへの疎通ができているかをチェックしましょう [#iiscn]_ 。
テストを書くのはだるいですが、一度やっておけば、バグや障害を検出することができますので、是非やりましょう。

.. [#iiscurl] http://serverspec.org/
.. [#iirspec] http://rspec.info/
.. [#iiscd] https://github.com/dwango/serverspecd 「d」とついているからといって、デーモンではありません
.. [#iiscdbun] bundleコマンドがなければ、``gem install bundler`` でインストールして下さい。``gem`` がなかったらrubyをインストールして下さい
.. [#iijibun] 自分自身といっても人ではなく、サーバのことです。自分のテストは健康診断にでも行って下さい(執筆時期が丁度そんな時期)
.. [#iisstest] 細かくすれば、テスト＝解決する問題となってわかりやすいんですけどね。テスト増えると管理が大変になると思う。でもテスト項目が多いと、テスト中の「....」が増えるので、見ていて面白い
.. [#iisstest2] 「Jenkinsで動かすとそれ、見えなくね？」「こ、コンソールで見ればいいし(震え声」「ん？　君、自動化って言ったよね？」
.. [#iisanti] SAN値とは、正気度を表すパラメーターのことである - http://dic.nicovideo.jp/a/san値
.. [#iijenkins] http://jenkins-ci.org/ Jenkins CI。継続的デリバリーには必須のアイテム。トリガーを設定してテストなどを実行できるソフトウエアです。実行の結果がわかりやすいです
.. [#iiscn] スイッチやロードバランサの設定がいつのまにか変わっていて疎通できない！(・ω・＼)SAN値!(／・ω・)／ピンチ!なんてことがないように


構築にはAnsible
^^^^^^^^^^^^^^^

構築を自動で行ってくれるソフトウエアといえば chef が有名になってきました。弊サークルが前回頒布した「ななかInside PRESS vol.4」で chef の特集をしているので、そちらもご覧ください [#iisutema]_ 。
同じツールを取り上げても面白くないので、ポストchefになりつつある [#iiann]_ Ansible [#iiansible]_ を使ってみます。IIの三層の図の「Configuration」の部分のソフトウエアです。

.. topic:: Configration界隈の動向

   構築を自動化するために、これまでに色々なツールが出ています。具体的には、Puppet, Chef, Ansible, Salt [#iisalt]_ などがあります。
   それぞれ特徴があり、業務や趣味に向いたものを使いましょう。このへんの比較で本が一冊出来てしまうので、さっくり比較したい場合は InfoWorldの記事 [#iipcas]_ をご覧ください。
   Puppet, Chef, Ansibleの比較記事では Ansible がイイヨ！って記事もあります [#iipca]_ 。
   chefはruby製なので日本で使われるようになったとかなんとか。時期的に新しく出てきたConfigrationツールはPythonを使う傾向にあるようです。Ansible, SaltはPython製です。

.. [#iisutema] ステマです（ツッコミ待ち
.. [#iisalt] http://www.saltstack.com/ 今調べてて知った。「Salt」ってググラビリティー低すぎ...。jujuってのもあんのか...乱立しすぎだろこの界隈
.. [#iipcas] http://www.infoworld.com/d/data-center/review-puppet-vs-chef-vs-ansible-vs-salt-231308?page=0,3
.. [#iipca] http://probably.co.uk/puppet-vs-chef-vs-ansible.html


Ansibleとは
""""""""""""""""""""

Michael DeHaan [#iiansmpd]_ 氏が作ったソフトウエアです [#iiansgithub]_ 。Cobblerに関わった人でもあります。Ansibleの哲学については、本人がGoogle Groupsに投稿したメッセージ「Ansible philosophy for those new to the list == keep it simple」 [#iiansp]_ をお読み下さい。

.. [#iiansmpd] https://github.com/mpdehaan
.. [#iiansgithub] https://github.com/mpdehaan/ansible
.. [#iiansp] https://groups.google.com/forum/#!topic/ansible-project/5__74pUPcuw

Ansibleの仕組みは、1台のControl Machine(CM)から複数のManaged Node(MN)へsshで接続を行います。CMでコマンドを実行すると、MNでCMで指定されたコマンドが実行されます。
Ansibleのwebサイトによると、「数時間で自動化できてとってもシンプル！」「構築先のサーバはノンパスsshで入れるようにしておけばOK！」「パワフル」[#iianpo]_ だそうです。
準備は、対象のホストへsshでノンパスでログインできるようにしておけばOK。あとノンパスsudoもつけてね。

Ansibleという言葉をALCのサイトで引いてみると、[#iiansalc]_ 「アンシブル◆光の速さより速く、瞬間的にコミュニケーションができるデバイス。ウルシュラ・ル・グインやオースン・スコット・カードのサイエンス・フィクションより。」だそうです。早そうですね(適当)

.. [#iianpo] どの辺がパワフルなのか実はよーわからん
.. [#iiansalc] http://eow.alc.co.jp/search?q=ansible&ref=sa

ここではLinux上でのAnsibleを解説します。Ansible 1.7から、MNとしてWindowsもサポートされたようなので、必要であればドキュメント [#iianwin]_ をご覧ください。CMはサポートしていないのでご注意。

.. [#iiann] 脳内調べ
.. [#iiansible] http://www.ansible.com/home
.. [#iianwin] http://docs.ansible.com/intro_windows.html

Ansibleのインストール
""""""""""""""""""""

Amazon EC2のAmazon Linux AMI [#iiami]_ では、下記のコマンドでインストール完了。最新版のAnsibleがインストールされます。

.. [#iiami] http://aws.amazon.com/jp/amazon-linux-ami/ amazonが作ったLinux ディストリビューション。CentOSの最新版みたいな感じのディストリビューション [脳内調べ]

.. code-block:: sh

   $ sudo easy_install pip
   $ sudo pip install ansible

DigitalOcenan の CentOS 7 では、こんな感じでした [#iianepel]_ 

.. [#iianepel] Redhat系で、EPELが入っているなら、 ``sudo yum install ansible`` でインストールできます

.. code-block:: sh

   sudo yum install -y gcc python-devel python-paramiko
   sudo easy_install pip
   sudo pip install ansible

Ansibleは、Python 2.4以上で動作し、Python 2.6以上の環境が推奨されます。Python 2.5以下では、 ``python-simplejson`` パッケージが必要です。CentOS 5などでインストールするときは注意してください。pip [#iipip]_ があるなら、 ``sudo easy_install simplejson`` でいけるはずです。
今回、Ansible 1.6.6を使いました。
 
.. [#iipip] https://pypi.python.org/pypi/pip Pythonのパッケージのマネージツール。Python版の cpan 的な立ち位置

つかう
""""""""""

Ansibleがインストールできたところで実行してみましょう。Ansibleを実行するサーバ(CM)は、お名前.comのVPS(CentOS 6.5)で、リモートマシン(MN)は DigitalOceanで2つ作ります。
リモートマシンを作る前にsshの公開鍵を、DigitalOceanに登録しておきましょう。

#TODO手順を書く

インスタンス(Droplets)を作るときに、登録したsshキーを登録するとrootでログインできます。インスタンスは1分くらいで起動してきます。Droplets [#iiansdrop]_ を作りました。

.. figure:: img/an-do-dl.eps
  :scale: 50%
  :alt: an-do-dl
  :align: center

  nozomiとeriのDroplets

.. [#iiansdrop] dropletsをALC(http://eow.alc.co.jp/search?q=droplet)でひくと、水滴とか飛沫という意味が引っかかったのでアレゲな感じ

``/etc/hosts`` にDropletsのIPアドレスを追記します [#iiandhosts]_ 。

:: 

   104.131.231.95 nozomi
   128.199.140.147 eri


.. [#iiandhosts] 分かってる方は別の方法でどうぞ

ログインしてみましょう。

.. code-block:: bash
   
   [tboffice@yoshihama4 ~]$ ssh root@104.131.231.95
   Welcome to Ubuntu 14.04 LTS (GNU/Linux 3.13.0-24-generic x86_64)
   
   * Documentation:  https://help.ubuntu.com/
    
   System information as of Sat Jul 19 15:29:53 EDT 2014
   
   System load: 0.08              Memory usage: 9%   Processes:       81
   Usage of /:  6.1% of 19.56GB   Swap usage:   0%   Users logged in: 0

   Graph this data and manage this system at:
        https://landscape.canonical.com/
   root@nozomi:~# 

ログイン成功。ユーザを作ります。Ubuntuだと ``adduser`` ですね。あとは公開鍵をそのユーザにコピーしてsudoできるようにします [#iiansinstallcom]_ 。

.. code-block:: bash

   # adduser tojo
   # adduser tojo sudo
   # visudo 
   %sudo   ALL=(ALL:ALL) NOPASSWD:ALL # 「NOPASSWORD」を追加
   # cp -a .ssh/ /home/tojo/
   # chown -R tojo. /home/tojo/.ssh

.. [#iiansinstallcom] cpとchownのところ、installコマンドを使って一行で書けないかと試行錯誤したんですが、うまくいきませんでした

ここまでくればCMサーバから ``$ ssh nozomi`` で入れます。 ``sudo ls -la /root/`` で、何か見れたら完了です。
ここからは、CMサーバの構築です。ansibleのhostsファイルを作ります。CentOS6で ``.ssh/config`` を読んでくれない [#iianscenth]_ ので細工もします。

.. [#iianscenth] https://github.com/yteraoka/ansible-tutorial/wiki/SSH のでhostsファイルに細工する


pip経由でansibleをインストールすると ``/etc/ansible`` ディレクトリが作られていないので作って下さい。``/etc/ansible/hosts``ファイルの中身はこんな感じです。

:: 

   nozomi ansible_ssh_user=tojo
   eri ansible_ssh_user=ayase


ansibleコマンドを実行してみましょう [#iianssshyes]_ 。

.. [#iianssshyes] sshで初めてのサーバに入ることになるので、yesとか押さないといけないんだけど省略

.. code-block:: bash

   $ ansible all -m ping
   
   nozomi | success >> {
       "changed": false, 
       "ping": "pong"
   }
   
   eri | FAILED => FAILED: Authentication failed.

失敗しましたね。エリチ(eri)サーバはセットアップしていませんでしたね。セットアップしてしまいましょう [#iianseri]_ 。

.. [#iianseri] ん？エリチをセットアップ？なんか卑猥ですね（おいやめろ（なお、朝7時くらいに書いている模様

起動しているので``ssh root@eri``でログイン。もし入れなかったらDigitalOceanのサイトのDropletsからeriサーバを選択してパスワードリセットしましょう [#iianslogin]_ 。

.. [#iianslogin] 筆者の場合はなぜか.sshディレクトリが600になってた...

.. figure:: img/an-do-passwdreset.eps
  :scale: 70%
  :alt: appprotweet
  :align: center

  DigitalOcean上でDropletsのパスワードリセット


.. code-block:: bash

   # useradd -G wheel ayase
   # yum install -y python-simplejson
   # visudo
   %wheel  ALL=(ALL)       NOPASSWD: ALL # コメントになっているので有効化
   # cp -a .ssh/ /home/ayase/
   # chown -R ayase. /home/ayase/.ssh

ここまでやればCMのサーバで ``ssh eri`` でログイン可能。再度 ansible コマンドを実行。

.. code-block:: bash

   [tboffice@yoshihama4 ~]$ ansible all -m ping 
   eri | success >> {
       "changed": false, 
       "ping": "pong"
   }
   
   nozomi | success >> {
       "changed": false, 
       "ping": "pong"
   }

pingに対してpongが帰ってきました。成功です。うまくいかない時は、ansibleのコマンドに-vvvオプションをつけると何をやっているかわかります [#iiansvvv]_ 。
筆者がハマったところは、接続先のサーバを何度も作りなおしていたので、.ssh/known_hostsファイルのキーを消さなかったため失敗することが有りました。

.. [#iiansvvv] ansible all -m ping 

お気づきですか？rootで入れるのであれば、MNサーバ側で実行したコマンドをansibleでやれそうですね。


必殺！アドホックコマンド投げつけ
""""""""""""""""""""""""""""""

Ansibleといえば、Inventry とか Playbook とかなんですが、後回しにしますね。ここでは、アドホックコマンド [#iiansad]_ に手を出してみましょう。サーバを作ったんだけど壊せなくて、本番サーバに更新を加えることが一度や二度、いや、もっとあったかな。
対象となっているサーバに、泥臭くコマンドを投げ込む方法を実践してみましょう。例えば、OSのディストリビューションを見てみましょう。

.. code-block:: sh
   
   $ ansible all -a "cat /etc/issue"
   eri | success | rc=0 >>
   CentOS release 5.8 (Final)
   Kernel \r on an \m

   nozomi | success | rc=0 >>
   Ubuntu 14.04 LTS \n \l

nozomiに対して sudo しないと実行できないコマンドを送ってみまそう。

.. code-block:: sh

   $ ansible nozomi -a "ls -l /root/.ssh" --sudo 
   nozomi | success | rc=0 >>
   total 4
   -rw------- 1 root root 402 Jul 20 07:03 authorized_keys

.. [#iiansad] http://docs.ansible.com/intro_adhoc.html

ファイルをコピーしてみます。

.. code-block:: sh
  
   $ ansible eri -m copy -a "src=/etc/hosts dest=/tmp/hosts"
    eri | success >> {
        "changed": true, 
        "dest": "/tmp/hosts", 
        "gid": 500, 
        "group": "ayase", 
        "md5sum": "fe54ebbbad6eb65cc89ecdfb79d80526", 
        "mode": "0664", 
        "owner": "ayase", 
        "size": 240, 
        "src": "/home/ayase/.ansible/tmp/ansible-tmp-1405855702.69-264966159997730/source", 
        "state": "file", 
        "uid": 500
    }

``-m`` オプションでモジュールを指定することが出来ます。モジュールの一覧は、``ansible-doc -l`` で見られます。copyモジュールの詳細を知りたい場合は ``ansible-doc copy`` と打って下さい。
CentOSの場合、yum経由で apache をインストールするので ``ansible eri -m yum -a "name=httpd state=latest" --sudo`` と実行します。Ubuntuの場合は ``ansible nozomi -m apt -a "name=apache2 state=latest" --sudo`` でインストールできます。
``ansible all -m setup`` とすると、OSやIPアドレス、ansibleの変数などの情報が取得できます。

アドホックなコマンドはこのへんにして、Playbookへ話を移しましょう。


Playbook
"""""""""

Playbookとは、MNに対してどのような設定するかを書いたAnsibleの設定ファイルです。中身はYAML [#iiasnayaml]_ です。
適当なディレクトリでPlaybookを作成しましょう。まずは ``yum-apache.yml`` というファイルに下記のように書きます。

.. [#iiasnayaml] http://docs.ansible.com/YAMLSyntax.html

.. code-block:: config

   ---
   - hosts: all
     user: root
     sudo: yes
     tasks:
       - name: yumでapacheをインストール
       - yum: name=httpd state=latest

対象のhostsをどうしましょうか。AWSのEC2だと面白く無いので DigitalOcean を使います(またか)。
honokaサーバ(IN LONDON)でCentOS 6.5の64bitで作りました。IPは178.62.48.99がとれてきました。

.. figure:: img/an-do-honoka.eps
  :scale: 70%
  :alt: condel
  :align: center

  honoka(IN LONDON)

SSHキーは作成済みなのでrootで入ってみましょう。

.. code-block:: config

   $ ssh root@178.62.48.99 cat /etc/redhat-release

``CentOS release 6.5 (Final)`` と出てきたら成功です。次にAnsibleのhostsファイルを書きましょう。``hosts.list`` というファイル名でこんな感じで書いてやります。

:: 

   honoka ansible_connection=ssh ansible_ssh_port=22 ansible_ssh_host=178.62.48.99

明示的に ``ansible_ssh_port=22`` としています。ポート番号を22から変更していれば、そのポート番号を指定して下さい。

.. topic:: CentOS 6だと失敗する罠

   対象サーバ(MN)であるhonokaはCentOS6.5を使いました。OpenSSHのバージョンがやや古く(5.3)、Ansibleを実行したとき、ControlPersistオプションが使えずエラーとなります。
   OpenSSHを5.6以降にバージョンアップするか、ansible.cfgにsshのオプションを上書きしてやります [#iianscent6]_ 。ansible.cfgはPlaybookを実行するディレクトリにおいておけばOK。ssh_argsの行は一行で書いて下さい。
   
   .. code-block:: sh

      [ssh_connection]
      ssh_args = -o PasswordAuthentication=no -o ControlMaster=auto 
        -o ControlPath=/tmp/ansible-ssh-%h-%p-%r


.. [#iianscent6] https://groups.google.com/forum/#!msg/ansible-project/M_QmqhwNynE/wyz-c0bXZmUJ

ファイル一覧を見るとこんな感じです。

.. code-block:: sh

   $ ls
   ansible.cfg  hosts.list  yum-apache.yml

さてPlaybookを実行してみましょう。

.. code-block:: sh

   $ ansible-playbook yum-apache.yml -i hosts.list
   
   PLAY [all] ******************************************************************** 
   
   GATHERING FACTS *************************************************************** 
   ok: [honoka]
   
   TASK: [yumでgitをインストールする] ****************************************************** 
   changed: [honoka]
   
   PLAY RECAP ******************************************************************** 
   honoka                     : ok=2    changed=1    unreachable=0    failed=0   

インストールできましたね。そろそろこのへんでネタばらしをすると、 ``/etc/ansible/hosts`` や ``/etc/hosts`` ファイルにクライアントのサーバの設定は必要ないんですねーやっちゃいましたね（何

そういえばもう一回、さっきのansibleのコマンドを叩くとどうなるでしょうか？もうインストールされているのでエラーになってしまうんでしょうか。

.. code-block:: sh

   $ ansible-playbook yum-apache.yml -i hosts.list
   
   PLAY [all] ******************************************************************** 
   
   GATHERING FACTS *************************************************************** 
   ok: [honoka]
   
   TASK: [yumでgitをインストールする] ******************************************************
   ok: [honoka]
   
   PLAY RECAP ******************************************************************** 
   honoka                     : ok=2    changed=0    unreachable=0    failed=0  


おや、エラーになっていませんね。わざとこんなことをやっているのには訳があります。IIではおなじみの冪等性(べきとうせい)です。

.. topic:: 冪等性(べきとうせい)

   何度やっても同じ結果になるという意味の言葉です。中途半端に構築したサーバでも、新規のサーバでも、同じPlaybook(Chefの場合はRecipe)を実行すれば、同じ状態になります。
   AnsibleやChefにあるモジュールは冪等性を担保しているので、何度実行してもサーバが同じ状態になります。それ以外の自分で書いたスクリプトは、自分で冪等性を担保しなければなりません(これが苦痛になることがあります)。

   構成管理における冪等性の利点はAnsibleやChefなどの構成管理ツールでコード化できる点です。できあがったサーバは、Serverspecやinfratasterを使ってテストを行い、動作の保証を行います。

   デプロイされているプログラムのアップデートにともなって、ミドルウエアのモジュールを追加したい場合があります。手順書をコード化してサーバで実行すれば、構築完了です。
   ただし、本番環境に対して変更を加える事はストレスになります。一方、本記事の冒頭にでてきた「作って壊す」という環境があれば、冪等性について考える必要はないかもしれません。
   そんな時はBlue-Green Deploymentで切り替えましょう。まてよ、そんな富豪的に使えるところってあるんですかねえ・・・


過去の遺産 Playback
""""""""""""""""""

俺は！！シェルスクリプトをッッッ！！！実行したいんだァァァァッ！！！！！という熱い方はPlaybookに下記のように書いてみてください。
なお、 ``hoge.sh`` ファイルはこのPlaybookと同じディレクトリにおいてください。
なお、このスクリプトは自分で冪等性を保証してください。もし環境を壊してしまったら、環境を一回壊して作りなおしてから再挑戦です。

.. code-block:: sh

   ---
   - hosts: all
     user: root
     tasks:
       - name: シェルスクリプトを実行
         script: hoge.sh


実践する
""""""""

AnsibleのPlaybookのサンプルが公開されています [#iiansexam]_ 。この中にある lamp-simple を実際に使ってみましょう。

.. [#iiansexam] https://github.com/ansible/ansible-examples

まずはCMサーバの適当なディレクトリで ``git clone https://github.com/ansible/ansible-examples.git`` して持ってきます。
webserverとdbserverの1つに役割が分かれています。DigitalOceanで、honokaとkotoriのDropletsを作成します [#iianshon]_ 。

.. [#iiansreadme] https://github.com/ansible/ansible-examples/blob/master/lamp_simple/README.md
.. [#iianshon] honokaはさっき作ったものをそのまま利用。やっぱりDropletsって言葉が（ｒｙ

.. figure:: img/an-do-honokoto.eps
  :scale: 70%
  :alt: an-do-honokoto
  :align: center

  honokaとkotoriのDroplets

hostsファイルを以下のように書き換えます。

:: 

   [webservers]
   honoka ansible_ssh_host=178.62.48.99
   
   [dbservers]
   kotori ansible_ssh_host=128.199.140.147

あとはansibleを実行するだけです。

.. code-block:: sh

   $ ansible-playbook -i hosts site.yml 

数分待てば、honokaにapacheが、dbserverにmysqlがそれぞれ立ち上がっていてhonokaにブラウザでアクセスするとDBの中身が読めた旨のメッセージがでてきます。

.. figure:: img/an-do-ans-lamp.eps
  :scale: 50%
  :alt: an-do-ans-lamp
  :align: center

  honokaサーバにアクセスすると、セットアップできてることが確認できる

さいごに
""""""""

さらに様々なPlaybookを探すには、Ansible Galaxy [#iiansag]_ を参照して下さい。
業務などできっちりやるなら、ベストプラクティスとしてディレクトリのレイアウト(http://docs.ansible.com/playbooks_best_practices.html)があります。どのサーバにどの変数を使うか、開発環境と本番環境を分けたりそういったことができます。また、「ansible ベストプラクティス」と検索するといくつかでてきます。

.. [#iiansag] https://galaxy.ansible.com/explore#/

参考
""""

* practice http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/
* 不思議の国のAnsible – 第1話 : http://demand-side-science.jp/blog/2014/ansible-in-wonderland-01/
* 今日からすぐに使えるデプロイ・システム管理ツール ansible 入門 - http://tdoc.info/blog/2013/05/10/ansible_for_beginners.html


仮想化そのいち Vagrant
^^^^^^^^^^^^^^^^^^^^^

* vagrantとは

  * Hashicorpのやつ
  * VirtualBoxのイメージを作成するツール
  * VMwareでも可
  * Boxと呼ばれるイメージを拾ってきてその中に入ってるOSを起動する
  * Boxはつくれる！かわいいは正義

* 使ってみる

  * DigitalOceanつかってみよう

* 参考

  * 仮想環境構築ツール「Vagrant」で開発環境を仮想マシン上に自動作成する : http://knowledge.sakura.ad.jp/tech/1552/
  * Windows7にVirtualBoxとVagrantをインストールしたメモ : http://k-holy.hatenablog.com/entry/2013/08/30/192243 
  * 1円クラウド・ホスティングDigitalOceanを、Vagrantから使ってみる : http://d.hatena.ne.jp/m-hiyama/20140301/1393669079


仮想化そのに docker
^^^^^^^^^^^^^^^^^^

.. figure:: img/docker-logo.eps
  :scale: 70%
  :alt: docker-logo
  :align: center

  Dockerのロゴ

Dockerとは、たいそう面白いギャグを連発して観客をどっかーどっかー沸かすソフトウエアです。違います。Dockerのgithub曰く「Docker: the Linux container engine」だそうです。LXCだったとかそういう歴史はふっ飛ばしていきなり実践してみましょう。

VMより良いと書いてあるがどういうことか

* dockerとは

  * chrootのつよいやつ
  * OS上にコンテナを作って、そのうえに環境をつくる
  * 差分が重要らしい
  * ネットワークまわりとか、ディレクトリ関連がどうなるのかわからん。chrootでよくね？
  * FAQ形式で掘っていくのもよいかもね。じゃがいもよろしくー

* 使ってみる


Cobbler
^^^^^^^^^

* kickstartはわかっている！環境つくるのめんどいんだよねー向けな人


flynn
^^^^^^

Surf
^^^^^^



その他の問題
------------


ログの管理どうする？
^^^^^^^^^^^^^^^^^^^

* fluentdを使って収集しましょう。いつでもサーバを壊せる状態にしておきましょう。
* Elasticsearch + kibanaでログを可視化できてはっぴー☆


DBどうするよ？
^^^^^^^^^^^^^^

* 気軽に壊せないので、こわさない。以上解散！


サーバの監視
^^^^^^^^^^^^^^^^^^^^

* 気軽にこわせて気軽に立ち上がるサーバに名前をつけると大変なことに！！！
* サーバに名前を付けることは悪であるという議論
* hobbitとかzabbixとかそういうツールだと登録してるホストがなくなるとデータがなくなっちゃうんだよねー過去のトレンドが消えてしまうことが問題
* mackerelを取り上げる。


CI as a Service
-----------------

* まだよくわかってない


まとめ
-------

* 本当にやりたいことは何だ？

  * 実際には運用に入ったサーバを作って壊す富豪的な環境ってあんまりないよね　お金もかかるし。オンプレミスだったらそんな余裕はないはず
  * 運用に入ったサーバの変更を安全にやるためにはどうする
  
* 現在進行形でみんな手探り状態
* おじさんのchef疲れ
* やりたいことを実現するためのツールが乱立している
* 新旧ツールをうまく組み合わせて事故のないデプロイをしていこう！

* インフラでの旨味。構築がミスなく簡単にできる。最初に乗り越えるハードルが高い。よく考えていないとハードルだらけになる。導入コスト
* プログラミングしている側からの便利さ。すぐに環境が作れる。テストの自動化。本番でのバグが少なくなる
* 開発環境DevOps
* 本番環境DevOps


注目すべきトレンド
-----------------

* どくだんとへんけん
* hashicorp http://www.hashicorp.com/blog
* kief morris http://kief.com/
* Martin Fowler http://martinfowler.com/
* chad fowler http://chadfowler.com/
* 英語だけど翻訳すればよめなくはない。雰囲気をつかもう


参考文献
--------
「継続的デリバリー 信頼できるソフトウェアリリースのためのビルド・テスト・デプロイメントの自動化」アスキー・メディアワークス,2012
「WEB+DB PRESS vol.81」技術評論社,2014


IIやる人はこれだけは最低限みておけリンク
------------------------------------

* 今さら聞けない Immutable Infrastructure - 昼メシ物語 / http://blog.mirakui.com/entry/2013/11/26/231658

  - IIについての話題をコンパクトにまとめている良記事。ただしIIはここで出てこないトピックもたくさんある



とりまとめついてない
------------------

* 必要なければdevopsに触れなくていっかなー
* 設定が漂流する。そこにIIを導入していくコスト。cultureは？
* IIが出てきた根源的な点はどこか？メリットが上回るものなのか？現状維持ではダメなのか？何故ダメになったのか？

みなおしする点
-------------

* Serverspecの綴りは、Sが大文字ですね
* 冪等性触れる


壮大なメモ
----------

* PhenixServer : http://martinfowler.com/bliki/PhoenixServer.html

  * フェニックスサーバ。認証監査をしようと思った

    * 今動いている本番環境を再度構築しなおすことになる
    * 定期的にサーバを焼き払ったほうがいい
    * サーバは灰の中から不死鳥のように蘇る。だからフェニックスサーバという
    * 構成のズレ、アドホックな変更でサーバの設定が漂流する。SnowflakeServersにいきつく

      * http://kief.com/configuration-drift.html Configration Drift

    * このような漂流に対向するためにpuppetやchefをつかってサーバを同期し直す。
    * netflixはランダムにサーバを落として大丈夫か試している（ひー

* SnowflakeServer : http://martinfowler.com/bliki/SnowflakeServer.html

  * スノーフレークサーバ。雪のかけらサーバという存在
  * OSやアプリケーションにパッチを当てたりする必要がある
  * 設定を調査すると、サーバによって微妙に違う
  * スキー場にとっては良いが、データセンターではよくない
  * スノーフレークサーバは再現が難しい
  * 本番での障害を開発環境で再現させても調査できない
　
    * 参考文献・目に見えるOpsハンドブック　http://www.amazon.com/gp/product/0975568604
   
  * 芸術家はスノーフレークを好むのだそうだ　http://tatiyants.com/devops-is-ruining-my-craft/
　
    * （サーバ含めそのなかのアプリケーションも工業製品なんだよ！！！わかったか！！！（横暴
    * （昔はひとつのサーバでなんとか出来たけど、今はアクセスも増えてサーバも増えたので芸術品はいらない！！
    * （どーどー落ち着けー、なーー
　
  * スノーフレークのディスクイメージを造ればいいじゃんという議論
  * だがこのディスクイメージはミスや不要な設定も一緒に入っている
  * しかもそれを変更することもある。壊れやすさの真の理由となる（雪だけに
  * 理解や修正がしにくくなる。変更したら影響がどこに及ぶかわからない
  * そんなわけで古代のOSの上に重要なソフトウエアが動作している理由である
  * スノーフレークを避けるためにはpuppetやchefを使って動作の確認のとれたサーバを保持すること
  * レシピを使用すつと、簡単に再構築できる。または、イメージデータを作れる
  * 構成はテキストファイルだから変更はバージョン管理される

  * nologinにしてchefなどからレシピを実行すれば、変更はすべてログに残り監査に対して有効
  * 構成の違いによるバグを減らし、全く同じ環境をつくれる。また、環境の違いに起因するバグを減らせる

    * 継続的デリバリーの本に言及する　あっ

* ConfigurationSynchronization : http://martinfowler.com/bliki/ConfigurationSynchronization.html

  * あんまり重要じゃない

* ImmutableServer : http://martinfowler.com/bliki/ImmutableServer.html

  * やっともどってこれた。この文章からスノーフレークとフェニックスサーバに飛んでいる
  * Netflixが実は実戦でやってたみたい　AMIつくってそれをAWS上に展開している

    * http://techblog.netflix.com/2013/03/ami-creation-with-aminator.html
    * AMIを作るツール　https://github.com/Netflix/aminator#readme


* WEB+DB PRESS 81からメモ

  - IIデメリット　サーバが立ち上がった状態からの変更を禁じているのでちょっとした変更を入れるのにもサーバを作りなおす必要がある
  - サーバの生成廃棄コストが頻繁にあると運用コストが増大する
  - サーバの作成や廃棄が簡単なクラウドを使うのが楽
  - ホストの生成廃棄プロセスをAPIでやれると楽。LBとかもAPIでやれると楽
  - クラスタ監視ツールにmackerel.ioを使おう
  - dokku , flynn, apache mesos, Surf
  - pakker
  - BGDepではLBをAPIで変更できると楽