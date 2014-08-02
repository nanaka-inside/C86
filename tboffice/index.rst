
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

  やめて！！(https://twitter.com/skoji/status/392588415473963008)

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
   ￣Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y^Y￣

マサカリが投げられましたね。この本については、後ほど触れることにしましょう。


あわせて読みたい
---------------

CHad Fowler氏 [#iichad]_ の「サーバを捨てて、コードを焼き付けろ！」 [#iitys]_ [#iitys2]_ というブログ記事があります。
その記事のJunichi Niino氏による邦訳 [#iihottan]_ を引用してみましょう。

  開発者として、あるいはしばしばシステム管理をする者として、これまで経験したもっとも恐ろしいものの1つは、長年にわたり稼働し続けてなんどもシステムやアプリケーションのアップグレードを繰り返してきたサーバだ。

  なぜか。その理由は、古いシステムはつぎはぎのような処置がされているに違いないからだ。障害が起きたときに一時しのぎのハックで対処され、コンフィグファイルをちょこっと直してやり過ごしてしまう。「あとでChefの方に反映しておくよ」とそのときは言うけれど、炎上したシステムの対処に疲れて一眠りしたあとでは、そんなことは忘れてしまうだろう。

  予想もしないところでcronのジョブが走り始めて、よく分からないけれどなにか大事な処理をしていて、そのことを知っているのは関係者のうちの1人だけとか。通常のソースコード管理システムを使わずにコードが直接書き換えられているとか。システムがどんどん扱いにくくなっていき、手作業でしかデプロイできなくなるとか。初期化スクリプトがもはや、思いも付かないような例外的な操作をしなければ動かなくなっているとか。

  もちろんOSは（きちんと管理されているならば）なんども適切にパッチが当て続けられているだろうが、そこには（訳注：やがて秩序が失われていくという）エントロピーの法則が忍び込んでくるものだし、適切に管理されていないとすればいちどもパッチは当てられず、もしこれからパッチを当てようものならなにが起きるか分からない。

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

本来は、バグを潰したコードを、すぐにでも安全に、本番サーバにデプロイしたい、と思っているんじゃないでしょうか。

.. [#iikz] http://www.amazon.co.jp/dp/4048707876


作って壊す、そして自動化
----------------------

Martin Fowler氏のブログに、PhoenixServer [#iifs]_ という記事があります。不死鳥のように蘇るサーバという意味です。
お仕事で動作中のサーバの監査行ったとき、本番と同じサーバを作ろうとしたところ、構成のズレやアドホックな変更でサーバの設定が「drift」(漂流)していたそうです [#iisfs]_ 。
だったらいっそのこと定期的にサーバを焼き払ったほうがよく、puppetやchefを使ってサーバを作り直そうと書かれています。

.. [#iifs] http://martinfowler.com/bliki/PhoenixServer.html
.. [#iisfs] そんなサーバのことを SnowflakeServer(雪の欠片サーバ) という http://martinfowler.com/bliki/SnowflakeServer.html

あるいは、実験環境をいじくりまくって、やっぱりもとの綺麗さっぱりした状態にもどしたい、なんて経験は一回や二回、いやもっとあったかな？
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

* データセンターにサーバを設置してケーブリング [#iicable]_ 。またはインスタンスを立ち上げ
* OSをインストール [#iigoldenimage]_ 
* ミドルウエアをインストールして設定ファイルを書く
* プログラムをデプロイ
* プログラムの動作を確認
* 監視ツールに登録
* DNSに登録
* LBに登録

.. [#iisetup] Serf という Orchestration ツール #immutableinfra http://www.slideshare.net/sonots/serf-iiconf-20140325 の14ページを参考にしました
.. [#iigoldenimage] ゴールデンイメージってやつもあるけど各自ぐぐってね！
.. [#iicable] 自動化無理

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
  :scale: 100%
  :alt: 3layer
  :align: center

  IIの三層

サーバをセットアップする生産ラインとしてこの３つの層がでてきます。矢印の方向に向かって、ベルトコンベアのようにサーバがセットアップされる様子を表しています。

* Orchestration　[#iisurf00]_ 
  
  * アプリケーションのデプロイ
  * 使われるツールやソフトウエア：Fabric, Capistrano, MCollective

* Configuration

  * ミドルウエアのインストールや設定
  * 使われるツールやソフトウエア：Puppet, Chef, AWS OpsWorks, Ansible

* Bootstrapping

  * OSのインストールやVM,クラウドのイメージの起動
  * 使われるツールやソフトウエア：Kickstart, Cobbler, OpenStack, AWS


どの層で何をやるかは、正確な定義はないので好きなようにしましょう。使われるツールからやれることを想像してみてください。ただし、どの層で何をやるのか決めておかないと手間が増えます。たとえば、kickstartでOSのユーザを作って、さらにChefでも同じユーザを作ろうとしてレシピがコケるとか。

.. [#iisurf00] Orchestrationからしれっと Surf を消してますが、まあ無視しましょう

以上は三層で終わっていますが、本誌ではそれに付け加えて２つの層を設定します。

* Agent
  
  * 外部サービスに自分を登録
  * 使われるツールやソフトウエア：Serf

* Test

  * デプロイされたプログラムの動作を確認
  * 使われるツールやソフトウエア：Serverspec



どうでしょうか [#ii]_ 。ここまでくると、先ほどの「サーバのセットアップの一般的手順」を網羅できましたね！ [#iitaechan]_ [#iiyarukoto]_

.. [#ii] このTestとAgentをOrchestrationに含めてもいいんですけどOrchestrationが頭でっかちになるんですよね [脳内調べ]
.. [#iitaechan] やったねタエちゃん、やること増えるよ！！
.. [#iiyarukoto] 初期コストかけて自動化の状態に持って行ってそこからあとは楽になる...と考えていた時期がありました(このへん、かなり大きな問題だったり...)


早速実践してみよう
----------------

IIの三層+二層をひと通り実践してみましょう。まずはServerspecから始めていきます。
Serverspecから始める理由は、手始めに手をつけるにはうってつけだからです。サーバのデプロイはchefでもAnsibleでもbashスクリプトでも手動でコマンドを打てば構築できます。
問題はそのあとです。誰がどうやって、そのサーバが正しくセットアップできているか調べるのか？それにはServerspecを使いましょう。


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
     HostName        nico.example.com
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
   rake serverspec:nico  # Run serverspec to nico

テスト実行してみます。成功したテストは ``.``  、失敗したテストは ``F`` で表示されます。失敗したテストの理由が表示されます。どんなコマンドを実行したか出るので、デバックするときに使います。

.. code-block:: sh

   $ rake serverspec:nico
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

今回、構築には [#iiann]_ Ansible [#iiansible]_ を使ってみます。IIの三層の図の「Configuration」の部分のソフトウエアです。

.. topic:: Configuration界隈の動向

   構築を自動化するために、これまでに色々なツールが出ています。具体的には、Puppet, Chef, Ansible, Salt [#iisalt]_ などがあります。
   それぞれ特徴があり、業務や趣味に向いたものを使いましょう。このへんの比較で本が一冊出来てしまうので、さっくり比較したい場合は InfoWorldの記事 [#iipcas]_ をご覧ください。
   Puppet, Chef, Ansibleの比較記事では Ansible がイイヨ！って記事もあります [#iipca]_ 。
   chefはruby製なので日本で使われるようになったとかなんとか。時期的に新しく出てきたConfigurationツールはPythonを使う傾向にあるようです。Ansible, SaltはPython製です。

.. [#iisalt] http://www.saltstack.com/ 今調べてて知った。「Salt」ってググラビリティー低すぎ...。jujuってのもあんのか...乱立しすぎだろこの界隈
.. [#iipcas] http://www.infoworld.com/d/data-center/review-puppet-vs-chef-vs-ansible-vs-salt-231308?page=0,3
.. [#iipca] http://probably.co.uk/puppet-vs-chef-vs-ansible.html


Ansibleとは
""""""""""""""""""""

Michael DeHaan [#iiansmpd]_ 氏が作ったソフトウエアです [#iiansgithub]_ 。Cobbler [#iianscobb]_ に関わった人でもあります。

.. [#iiansmpd] https://github.com/mpdehaan
.. [#iiansgithub] https://github.com/mpdehaan/ansible
.. [#iianscobb] http://www.cobblerd.org/
.. [#iiansp] https://groups.google.com/forum/#!topic/ansible-project/5__74pUPcuw

Ansibleのwebサイトでは、「数時間で自動化できてとってもシンプル！」「構築先のサーバはノンパスsshで入れるようにしておけばOK！」「パワフル」 [#iianpo]_ と書かれています。
Ansibleの仕組みは、1台のControl Machine(CM)から複数のManaged Node(MN)へsshで接続を行います。CMでコマンドを実行すると、MNでCMで指定されたコマンドが実行されます。
インストール対象となるサーバにエージェントを入れる必要はなく、対象のホストにsshでノンパスでログインできるようにしておくことと、そのユーザでノンパスsudoができるようになっていれば準備完了です。
また、設定ファイル(Playbookという)はYAMLで作成すればよく、変数の概念はありますが、プログラミングの知識はほぼ必要がありません。

.. [#iianpo] どの辺がパワフルなのか実はよーわからん
.. [#iiansalc] http://eow.alc.co.jp/search?q=ansible&ref=sa

.. Ansibleという言葉をALCのサイトで引いてみると [#iiansalc]_ 「アンシブル◆光の速さより速く、瞬間的にコミュニケーションができるデバイス。ウルシュラ・ル・グインやオースン・スコット・カードのサイエンス・フィクションより。」だそうです。早そうですね(適当)

ここではLinux上でのAnsibleを解説します。Ansible 1.7から、MNとしてWindowsもサポートされたようなので、必要であればドキュメント [#iianwin]_ をご覧ください。CMはサポートしていないのでご注意。

.. [#iiann] 脳内調べ
.. [#iiansible] http://www.ansible.com/home
.. [#iianwin] http://docs.ansible.com/intro_windows.html

Ansibleのインストール
""""""""""""""""""""""

Amazon EC2のAmazon Linux AMI [#iiami]_ では、下記のコマンドでインストール完了。最新版のAnsibleがインストールされます。

.. [#iiami] http://aws.amazon.com/jp/amazon-linux-ami/ amazonが作ったLinux ディストリビューション。CentOSの最新版みたいな感じのディストリビューション [脳内調べ]

.. code-block:: sh

   $ sudo easy_install pip
   $ sudo pip install ansible

CentOS 7 では、こんな感じでした [#iianepel]_ 

.. [#iianepel] Redhat系で、EPELが入っているなら、 ``sudo yum install ansible`` でインストールできます

.. code-block:: sh

   $ sudo yum install -y gcc python-devel python-paramiko
   $ sudo easy_install pip
   $ sudo pip install ansible

Ansibleは、Python 2.4以上で動作し、Python 2.6以上の環境が推奨されます。Python 2.5以下では、 ``python-simplejson`` パッケージが必要です。CentOS 5などでインストールするときは注意してください。pip [#iipip]_ があるなら、 ``sudo pip install simplejson`` でいけるはずです。今回、Ansible 1.6.6を使いました。
 
.. [#iipip] https://pypi.python.org/pypi/pip Pythonのパッケージのマネージツール。Python版の cpan 的な立ち位置

つかう
""""""""""

Ansibleがインストールできたところで実行してみましょう。Ansibleを実行するサーバ(CM)は、お名前.comのVPS(CentOS 6.5)で、リモートマシン(MN)は DigitalOceanで2つ作ります。
リモートマシンを作る前にsshの公開鍵を、DigitalOceanに登録しておきましょう。

#TODO手順を書く DigitalOceanの説明。SSDを使えるVPSサービス。AWS上に構築されてる

インスタンス(Droplets)を作るときに、登録したsshキーを登録するとrootでログインできます。インスタンスは1分くらいで起動してきます。

.. figure:: img/an-do-dl.eps
  :scale: 70%
  :alt: an-do-dl
  :align: center

  nozomiとeriのDroplets

``/etc/hosts`` にDropletsのIPアドレスを追記します [#iiandhosts]_ 。
TODO このへんもいらない

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
ここからは、CMサーバの構築です。ansibleのhostsファイルを作ります。

TODO .ssh/configを作る話

pip経由でansibleをインストールすると ``/etc/ansible`` ディレクトリが作られていないので作って下さい。 ``/etc/ansible/hosts`` ファイルの中身はこんな感じです。

:: 

   nozomi 
   eri 


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

起動しているので ``ssh root@eri`` でログイン。もし入れなかったらDigitalOceanのサイトのDropletsからeriサーバを選択してパスワードリセットしましょう [#iianslogin]_ 。

.. [#iianslogin] 筆者の場合はなぜか.sshディレクトリが600になってた...

.. figure:: img/an-do-passwdreset.eps
  :scale: 70%
  :alt: appprotweet
  :align: center

  DigitalOcean上でDropletsのパスワードリセット


.. code-block:: bash

   [root@eri ~]# useradd -G wheel ayase
   [root@eri ~]# yum install -y python-simplejson
   [root@eri ~]# visudo
   %wheel  ALL=(ALL)       NOPASSWD: ALL # コメントになっているので有効化
   [root@eri ~]# cp -a .ssh/ /home/ayase/
   [root@eri ~]# chown -R ayase. /home/ayase/.ssh

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

.. topic:: known_hostsを無視する方法

   筆者がハマったところは、DigitalOceanの接続先のホストを何度も作りなおしていました。同じ Region でホストを作ると、前回使ったGlobal IPアドレスが使いまわされます。
   当然のことながら ``.ssh/known_hosts`` ファイルのキーを消さないとsshのログインに失敗します。そのときは、あらかじめ ``ansible.cfg`` に下記を書いておくと良いです。
   
   .. code-blcok:: conf

      [defaults]
      host_key_checking=False



.. [#iiansvvv] ansible all -m ping 

お気づきですか？rootで入れるのであれば、MNサーバ側で実行したコマンドをAnsibleのPlaybookにできそうですね。


出没！アドホックコマンド投げつけック天国
""""""""""""""""""""""""""""""""""""

タイトル無理やり過ぎないですかね。ええ。筆者もそう思っています [#iiansnande]_ 。

.. [#iiansnande] なぜつけたし

Ansibleといえば、Inventry とか Playbook の解説だとおもった？後回しにしますね。ここでは、アドホックコマンド [#iiansad]_ に手を出してみましょう。サーバを作ったんだけど壊せなくて、本番サーバに更新を加えることが一度や二度、いや、もっとあったかな。毎日かな？　
対象となっているサーバに、泥臭くコマンドを投げ込む方法を実践してみましょう。一例として、OSのディストリビューションを見てみましょう。

.. code-block:: sh
   
   $ ansible all -a "cat /etc/issue"
   eri | success | rc=0 >>
   CentOS release 5.8 (Final)
   Kernel \r on an \m

   nozomi | success | rc=0 >>
   Ubuntu 14.04 LTS \n \l

nozomiに対して ``sudo`` しないと実行できないコマンドを送ってみましょう。 ``--sudo`` オプションを付けます。

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
CentOSの場合、yum経由で apache をインストールするので 

.. code-block:: sh

   ansible eri -m yum -a "name=httpd state=latest" --sudo

と実行します。Ubuntuの場合は 

.. code-block:: sh

   ansible nozomi -m apt -a "name=apache2 state=latest" --sudo

でインストールできます。``ansible all -m setup`` とすると、OSやIPアドレス、ansibleの変数などの情報が取得できます。

アドホックなコマンドはこのへんにして、Playbookへ話を移しましょう。


Playbook
"""""""""

Playbookとは、MNに対してどのような設定するかを書いたAnsibleの設定ファイルです。中身はYAML [#iiasnayaml]_ です。
適当なディレクトリでPlaybookを作成しましょう。まずは ``yum-apache.yml`` というファイルに下記のように書きます。

.. [#iiasnayaml] YAMLの書き方はこちらを参照。jsonよりマシ。 http://docs.ansible.com/YAMLSyntax.html

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
  :scale: 80%
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
   
   .. [#iianscent6] https://groups.google.com/forum/#!msg/ansible-project/M_QmqhwNynE/wyz-c0bXZmUJ

   .. code-block:: sh

      [ssh_connection]
      ssh_args = -o PasswordAuthentication=no -o ControlMaster=auto 
        -o ControlPath=/tmp/ansible-ssh-%h-%p-%r


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
   AnsibleやChefにあるモジュールは冪等性を担保しているので、何度実行してもサーバが同じ状態になります。それ以外の自分で書いたスクリプトは、自分で冪等性を担保しなければなりません(これがつらさを生み出す原因になることがあります)。

   構成管理における冪等性の利点はAnsibleやChefなどの構成管理ツールでコード化できる点です。できあがったサーバは、Serverspecやinfratasterを使ってテストを行い、動作の保証を行います。

   デプロイされているプログラムのアップデートにともなって、ミドルウエアのモジュールを追加したい場合があります。手順書をコード化してサーバで実行すれば、構築完了です。
   ただし、本番環境に対して変更を加える事はストレスになります。一方、本記事の冒頭にでてきた「作って壊す」という環境があれば、冪等性について考える必要はないかもしれません。
   そんな時はBlue-Green Deploymentで切り替えましょう。といっても、そんな富豪的に使えるところってあるんですかねえ・・・


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

AnsibleのPlaybookのサンプルが公開されています [#iiansexam]_ 。この中にある ``lamp-simple`` を実際に使ってみましょう。

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
業務などできっちりやるなら、ベストプラクティスとしてディレクトリのレイアウト(http://docs.ansible.com/playbooks_best_practices.html)があります。どのサーバにどの変数を使うか、実験環境と本番環境を分けたりそういったことができます。また、「ansible ベストプラクティス」と検索するといくつかでてきます。

.. [#iiansag] https://galaxy.ansible.com/explore#/

参考
""""

* practice http://www.stavros.io/posts/example-provisioning-and-deployment-ansible/
* 不思議の国のAnsible – 第1話 : http://demand-side-science.jp/blog/2014/ansible-in-wonderland-01/
* 今日からすぐに使えるデプロイ・システム管理ツール ansible 入門 - http://tdoc.info/blog/2013/05/10/ansible_for_beginners.html


仮想化・その1 Vagrant編
^^^^^^^^^^^^^^^^^^^^^^

仮想化のツールとして、HashiCorp [#iihashi]_ が提供しているVagrant [#iiveg]_ を取り上げます。Vagrantとは、ホストOS上に独立した仮想マシンを立ち上げることができるツールです。
Vagrantの仮想マシンは、Boxというファイルに保存することができます。
Vagrantがインストールされているマシンに、Boxファイルを読み込ませれば、保存されたマシンが起動します。仮想マシンを気軽に作ったり壊したりできます。

Vagrantはruby [#iivaggh]_ で書かれています。対応しているOSは、Max OS X、主要なLinuxのディストリビューション、Windowsです。設定ファイルは、Vagrantfileというファイルに記述します。
仮想マシンは、デフォルトではVirtualBox上で起動します。それ以外にも、VMwareやAWS、DigitalOceanにも仮想マシンを立てることができます。仮想マシンを立てられるプラットフォームをプロバイダーと呼びます。

.. [#iihashi] http://www.hashicorp.com/
.. [#iiveg] http://www.vagrantup.com/
.. [#iivaggh] https://github.com/mitchellh/vagrant


インストール
""""""""""""

まずは、Vagrant + VirtualBox の組み合わせを試します。

* Max OS X へインストール

Vagrant [#iivagmacin]_ , VirtualBox [#iivagvbin]_ とも、公式サイトでMac OS X用のインストーラが用意されています。

.. [#iivagmacin] http://www.vagrantup.com/downloads.html インストーラはここからダウンロード
.. [#iivagvbin] https://www.virtualbox.org/wiki/Downloads インストーラはここからダウンロード

.. figure:: img/vagrant-mac.eps
  :scale: 50%
  :alt: vagrant-mac
  :align: center

  Vagrantのインストーラ

.. figure:: img/virtualbox-mac.eps
  :scale: 50%
  :alt: virtualbox-mac
  :align: center

  VirtualBoxのインストーラ

* CentOS 6.5にインストール

Vagrant は RPM でリリースされています。ホストOSのカーネルバージョンに依存します。起動しているカーネルと同じバージョンの ``kernel-devel`` ``kernerl-headers`` がインストールされていないとVirtualBoxが起動しません。もしなければ、RPMを探してインストールしましょう [#iivagker]_ 。

.. [#iivagker] DigitalOceanのDropletsでやってみたところ、起動しているカーネルとインストールされているkernel-develなどのバージョンが違い、ハマる

kernelに依存するので、カーネルが変わってもモジュールを再コンパイルしてくれる ``dkms`` [#dkms]_ も合わせてインストールしておきます [#iivagperl]_ 。
VirtualBoxのRPMのファイルサイズが大きいので、一旦wgetしてから ``yum install`` に噛ませます [#iivagdl]_  。

.. [#dkms] Dynamic Kernel Module Support - http://linux.dell.com/dkms/
.. [#iivagperl] perlが入っていないとインストール出来ないので注意。DigitalOceanのCentOS6.5でハマるなど
.. [#iivagdl] VPS上でのwgetが遅ければ、一旦ローカルにダウンロードしてきてDropboxか何かでファイル共有するのが早い

.. code-block:: sh

   [root@rin ~]# rpm -ivh vagrant_1.6.3_x86_64.rpm 
   Preparing...                ########################################### [100%]
      1:vagrant                ########################################### [100%]
   [root@rin ~]# rpm -ivh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
   [root@rin ~]# yum install dkms
   [root@rin ~]# wget http://download.virtualbox.org/virtualbox/4.3.14/VirtualBox-4.3-4.3.14_95030_el6-1.x86_64.rpm
   [root@rin ~]# yum install http://download.virtualbox.org/virtualbox/4.3.14/VirtualBox-4.3-4.3.14_95030_el6-1.x86_64.rpm
   [root@rin ~]# /etc/init.d/vboxdrv setup


vagrant upして仮想マシンを起動
"""""""""""""""""""""""""""""

仮想マシンを起動してみましょう。ここでは、CentOS 6.5 をホストOSとして仮想マシンを起動して、その仮想マシンにsshでログインするまでのコマンドです。

.. code-block:: sh

   [hoshizora@rin ~]# cd ; mkdir vmachine ; cd vmachine
   [hoshizora@rin ~]$ vagrant init hashicorp/precise32
   A `Vagrantfile` has been placed in this directory. You are now
   ready to `vagrant up` your first virtual environment! Please read
   the comments in the Vagrantfile as well as documentation on
   `vagrantup.com` for more information on using Vagrant.
   [hoshizora@rin ~]# vagrant up
   [hoshizora@rin ~]# vagrant ssh

一行目で、Vagrantを起動するためのファイル(Vagrantfile)を置くため、適当なディレクトリを作っています。
次の行で、作成するBox名(hashicrop/precise32)を指定します。これが終わるとVagrantfileが作られています。コメントを外した中身はたった4行です。

:: 

   VAGRANTFILE_API_VERSION = "2"
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.box = "hashicorp/precise32"
   end

これだけで仮想マシンの準備ができました。

``vagrant up`` を実行すると、vagrantcloud.comからboxのダウンロードが始まります。vagrantcloud.comには様々なOS, アプリケーションがインストール済みのBoxファイルがあるので、目的に合わせたものを選択して使うことができます。

コマンドの実行に若干時間がかかりますが、これらのコマンドでUbuntu 12.04 LTSの仮想マシンがVirtualBox上で立ち上がります。 ``vagrant ssh`` で、その仮想マシンにsshでログインできます。
下記のディレクトリに、VirtualBoxのvmdkなどのファイルがおいてあります。

.. code-block:: sh

   $ ll ~/.vagrant.d/boxes/hashicorp-VAGRANTSLASH-precise32/1.0.0/virtualbox/
   total 288344
   -rw------- 1 hoshizora hoshizora 295237632 Aug  1 04:32 box-disk1.vmdk
   -rw------- 1 hoshizora hoshizora     14103 Aug  1 04:32 box.ovf
   -rw-rw-r-- 1 hoshizora hoshizora        25 Aug  1 04:32 metadata.json
   -rw-r--r-- 1 hoshizora hoshizora       505 Aug  1 04:32 Vagrantfile


* vagrant command

ここで、vagrantのコマンドを見ていきます。vagrantコマンドを単体で打つとヘルプが表示されます。仮想マシンの様子を見てみます。

.. code-block:: sh

   $ vagrant status
   Current machine states:
   
   default                   running (virtualbox)
   
   The VM is running. To stop this VM, you can run `vagrant halt` to
   shut it down forcefully, or you can run `vagrant suspend` to simply
   suspend the virtual machine. In either case, to restart it again,
   simply run `vagrant up`.

``vagrant box list`` で仮想マシンのBoxのリストが表示されます。 ``vagrant halt`` で仮想マシンの電源を切ります。 ``vagrant suspend`` というコマンドもあり、その名の通り仮想マシンがsuspend状態になります。destroyで仮想マシンの削除です。これらのコマンドは、Vagrantfileがあるディレクトリで実行しないと怒られます。激おこです。

.. code-block:: sh

   $ vagrant box list
   hashicorp/precise32 (virtualbox, 1.0.0)

   $ vagrant halt
   ==> default: Attempting graceful shutdown of VM...

   $ vagrant destroy
       default: Are you sure you want to destroy the 'default' VM? [y/N] y


* Vagrantfile

Vagrantfileを編集してみましょう。ホストOSとディレクトリの共有の設定を書きます。ホストファイルの /hoge ディレクトリ(絶対パスでかけばどこでもおｋ)を、仮想マシンの /tmp にマウントしてみます。
仮想マシンに適当なディレクトリを作っておくのがセオリーです。今さっきdestroyしてしまったので、ありもののディレクトリにマウントします。
Vagrantfileを下記のように編集します。

:: 

   config.vm.box = "hashicorp/precise32"
   config.vm.synced_folder "/hoge", "/var/tmp" # この行を追記

``vagrant up`` して、 ``vagrant ssh`` するとマウントされていることが確認できます。今回は問題ないのですが、次回以降、Vagrantfileを書き換えたら、 ``vagrant reload`` すると変更が適用されます。再起動するのでご注意。次の準備があるので、ここで仮想マシンをdestroyしておきましょう。


* provisioning

サーバの基本的な設定やソフトウエアのインストールを自動化することができます。これを提供するのがプロビジョニングという機能です。
手元に用意したシェルスクリプト(script.sh)を、仮想のマシンに実行してみます。
Vagrantfileと同じディレクトリにscript.shを用意します。 ``date`` の内容をファイルに書き出す簡単なものです。

:: 

   #!/bin/sh
   date > /tmp/nya


先ほどのVagrantfileを編集します。inlineでコマンドを直接書くことも出来ます。また、pathにファイルを渡すと実行してくれます。

:: 

   config.vm.box = "hashicorp/precise32"
   config.vm.provision "shell", inline: "echo hello" # この行を追加
   config.vm.provision "shell", path: "script.sh" #この行も追加

プロビジョニングを実行します。

.. code-block:: sh

   $ vagrant provision
   ==> default: Running provisioner: shell...
       default: Running: inline script
   ==> default: stdin: is not a tty
   ==> default: hello
   ==> default: Running provisioner: shell...
       default: Running: /tmp/vagrant-shell20140802-28134-1xoahlm.sh
   ==> default: stdin: is not a tty

``vagrant ssh`` すると、 /tmp/nya ファイルができています。プロビジョニングが実行されるタイミングについては、Vagrantのドキュメント [#iivagpro]_ を参照して下さい。

.. [#iivagpro] https://docs.vagrantup.com/v2/provisioning/index.html

* provisoning - ansible編

プロビジョニングの例では、コマンド呼び出しやシェルスクリプトの実行を行いました。その他に、ChefやPuppet、Ansibleも呼び出すことができます。
Ansibleに触れたところなので、今回はプロビジョニングにAnsibleを使ってみます。仮想マシンは2台立ち上げて、ホストOSのVagrantfileからAnsibleを実行してみます。

Vagrantfileの設定です。下記のようにします。

:: 

   VAGRANTFILE_API_VERSION = "2"
   
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.define :honoka do |node|
       node.vm.box = "hashicorp/precise32"
       node.vm.network :forwarded_port, guest: 22, host: 2001, id: "ssh"
       node.vm.network :private_network, ip: "192.168.56.101"
       config.vm.provision "ansible" do |ansible|
         ansible.playbook = "playbook.yml"
         ansible.extra_vars = { ansible_ssh_user: 'vagrant' }
         ansible.sudo = true
       end
     end
     
     config.vm.define :rin do |node|
       node.vm.box = "hashicorp/precise32"
       node.vm.network :forwarded_port, guest: 22, host: 2002, id: "ssh"
       node.vm.network :forwarded_port, guest: 80, host: 8000, id: "http"
       node.vm.network :private_network, ip: "192.168.56.102"
     end
   end

config.vm.defineが2回登場します。仮想マシンを2つ起動する設定です。それぞれの仮想マシンに設定を行います。各オプションの簡単な解説です。

forwarded_port
  仮想マシンのポートをホストOSのどのポートに割り当てるかを指定します

private_network
  VirtualBox上の仮想マシンのプライベートネットワークとIPアドレスを設定します。実は今回のプロビジョニングでは使用しません。仮想マシンから他の仮想マシンへのアクセスの必要があるときに使います。もちろん、ホストOSからこの指定したアドレス(例えば192.168.56.101)にアクセスすることができます

ansible.playbook
  ansibleで実行するPlaybookのファイル名を指定します。playbook.ymlはカレントディレクトリに配置します

ansible.extra_vars
  sshのログインアカウントはデフォルトvagrantが作られているため、そのユーザ名を利用します

ansible.sudo
  ansibleコマンドに ``--sudo`` が付きます


``host`` ファイルに、仮想マシンのホスト名を書きます。

::
   
   # host
   [otonoki]
   honoka ansible_connection=ssh 
   rin ansible_connection=ssh 

CentOS 6系では、``~./.ssh/config`` を読んでくれない問題の回避をするため、ansible.cfgに下記を書きます。

::  
   
   # ansible.cfg
   [ssh_connection]
   ssh_args = 

最後にPlaybookです。apacheのインストールと、HTTPでアクセスしたときに表示するテキストを作っておきましょう。

.. code-block:: sh

   echo 雨やめー！！ > honoka


:: 

   ---
   - hosts: all
     tasks:
     - name: ensure apache is at the latest version
       apt: pkg=apache2 state=latest
     - name: ensure apache is running
       service: name=apache2 state=started
     - name: copy test file
       copy: src=honoka dest=/var/www


``vagrant up`` で仮想マシンを起動します。無事に仮想マシンが立ち上がり、apacheがインストールされたでしょうか。
初回起動時に、provisionの設定があると自動的にprovisionを実行します。playbook.ymlなどを変更してプロビジョニングをやり直したいときは、 ``vagrant provision`` を実行して下さい。
なお、上記の設定だと、rinの仮想マシンでもplaybook.ymlが適用されてしまいます。各自直してみてください。


* vagrant share

Vagrantには、作った仮想マシンをネット上に公開する機能があります。VAGRANT CLOUDのサイトからアカウントを登録して、コマンドラインから公開したい仮想マシンを ``vagrant share`` すると公開されます。

まずは、VAGRAT CLOUD(https://vagrantcloud.com/)にアカウントを登録します。「JOIN VAGRANT CLOUD」というリンクがあるので、そこからメールアドレスとパスワードを登録します。

.. figure:: img/vagrantc.eps
  :scale: 70%
  :alt: vagrantc
  :align: center

  Vagrant Cloudの画面(https://vagrantcloud.com/)

登録が終わったら、コマンドラインに戻ります。登録時に入力したログインアカウントを入力します。

.. code-block:: sh

   $ vagrant login
   In a moment we'll ask for your username and password to Vagrant Cloud.
   After authenticating, we will store an access token locally. Your
   login details will be transmitted over a secure connection, and are
   never stored on disk locally.
   
   If you don't have a Vagrant Cloud account, sign up at vagrantcloud.com
   
   Username or Email: user@example.com
   Password (will be hidden): 
   You're now logged in!

公開してみます。

   $ vagrant status
   Current machine states:
   
   honoka                    running (virtualbox)
   rin                       running (virtualbox)

   $ vagrant share honoka
   ==> honoka: Detecting network information for machine...
       honoka: Local machine address: 192.168.56.101
       honoka: Local HTTP port: 80
       honoka: Local HTTPS port: disabled
   ==> honoka: Checking authentication and authorization...
   ==> honoka: Creating Vagrant Share session...
       honoka: Share will be at: dynamite-antelope-8007
   ==> honoka: Your Vagrant Share is running! Name: dynamite-antelope-8007
   ==> honoka: URL: http://dynamite-antelope-8007.vagrantshare.com


この状態で放置します。別の端末からcurlコマンドを叩いて、応答が返ってくることを確認します。もちろんブラウザからURLを入力しても構いません。

.. code-block:: sh

   curl http://dynamite-antelope-8007.vagrantshare.com/honoka
   雨やめー！！

VAGRANT CLOUDのサイトからも共有されていることが確認できます。

.. figure:: img/vagrant-share.eps
  :scale: 70%
  :alt: vagrant-share
  :align: center

  Vagrant Cloudの画面(https://vagrantcloud.com/shares)

share中の状態では、仮想マシンをVAGRNT CLOUD上にアップロードしているわけではなく、プロキシされています [#ngrok]_ 。その証拠に、ApacheのアクセスログにNATされたIPアドレスが残ります。
shareを終了するには、``vagrant share honoka`` のコマンドを叩いたところでCtrl+cを打ち込みます。
設定次第で、SSHでも仮想マシンにアクセスすることができます。セキュリティには注意して下さい。

.. [#ngrok] 外部からローカルホストにトンネルつくって、インターネットからアクセスできるツールにngrok(https://ngrok.com/)があります


* DigitalOceanプラグイン

プロバイダーとしてDigitalOceanが選択できます。内部では、DigitalOceanのAPI(v2)を叩いています。
ここでは、ホストOSに引き続きCentOS 6.5を使っていきます。
まずはDigitalOceanでClient IDとAPI Keyを取得します。このページのURL(https://cloud.digitalocean.com/api_access)へのリンクは見つけにくいので、URLを直にたたいた方が早いです。

.. figure:: img/do-api-key.eps
  :scale: 70%
  :alt: do-api-key
  :align: center

  DigitalOceanでClient_idとAPI Keyを生成(https://cloud.digitalocean.com/api_access)

token を取得します。tokenを作るときに、Write権限の設定にチェックを入れて下さい。Dropletが作れずDigitalOceanのAPIがエラーを返します。

.. figure:: img/do-gen-token.eps
  :scale: 70%
  :alt: do-gen-token
  :align: center

  DigitalOceanでAPI(https://cloud.digitalocean.com/settings/applications)

.. figure:: img/do-gen-token2.eps
  :scale: 70%
  :alt: do-gen-token2
  :align: center

  Writeにチェックを入れましょう

DigitalOceanにSSH Keysの名前を登録していない場合はホストOSの公開鍵を登録します。登録した鍵の名前が必要です。ここではpublickeyとしています。
ここまでできたら、適当なディレクトリにVafrantfileを作りましょう。取得したClient IDとAPI KEY、tokenを入力します。512MBの最小インスタンスで、Ubuntu 14.04 x64のイメージを使ってシンガポールリージョン(sgp1)にDropletを作成します。

:: 

   VAGRANTFILE_API_VERSION = "2"
   Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
     config.vm.hostname              = 'umi'
     config.vm.provider :digital_ocean do |provider, override|
       override.ssh.private_key_path = '~/.ssh/id_rsa'
       override.vm.box               = 'digital_ocean'
       override.vm.box_url           = "https://github.com/smdahlen/vagrant-digitalocean/raw/master/box/digital_ocean.box"
       provider.client_id            = 'Client IDを入力'
       provider.api_key              = 'API KEYを入力'
       provider.token                = 'tokenを入力'
       provider.image                = 'Ubuntu 14.04 x64'
       provider.region               = 'sgp1'
       provider.size                 = '512mb'
       provider.ssh_key_name         = 'publickey' # DigitalOceanに登録している公開鍵の名前
     end
     config.vm.provision "ansible" do |ansible|
       ansible.playbook = "playbook.yml"
       ansible.sudo = true
     end
   end


ホストOSとなるマシンに、vagrant-digitalocean プラグインをインストールします。プラグインの詳細はこちらから：https://github.com/smdahlen/vagrant-digitalocean [#iivagdoa]_ 
また、MacをホストOSにする場合は、DigitalOceanのAPIを叩く都合上、 ``brew install curl-ca-bundle`` でCA bundleのインストールを行って下さい。

.. [#iivagdoa] 私が確認した時は、README.mdのConfigureの設定が足りませんでした

.. code-block:: sh

   $ vagrant plugin install vagrant-digitalocean


playbook.ymlの内容は、apacheをインストールして、起動、ホストOSにあるファイルを仮想マシンのドキュメントルートに配置します。

:: 

   ---
   - hosts: all
     tasks:
     - name: ensure apache is at the latest version
       apt: pkg=apache2 state=latest
     - name: ensure apache is running
       service: name=apache2 state=started
     - name: copy test file
       copy: src=umi dest=/var/www/html

ドキュメントルートに置くファイルをバーンと作成。

.. code-block:: sh

   echo "みんなのハート打ち抜くゾ！　バーン！" > umi

仮想マシンを立ち上げます。今回は、DigitalOceanのAPIにアクセスしてDropletを作っています。

.. code-block:: sh

   $ vagrant up --provider=digital_ocean
   Bringing machine 'default' up with 'digital_ocean' provider...
   ==> default: Using existing SSH key: yoshihama4
   ==> default: Creating a new droplet...
   
   ==> default: Assigned IP address: 128.199.134.160
   ==> default: Rsyncing folder: /home/tboffice/precise32/ => /vagrant...
   ==> default: Running provisioner: ansible...
   (略)

   $ curl 128.199.134.160/umi
   みんなのハート打ち抜くゾ！　バーン！

無事に起動しましたね。Playbookを変更したら、 ``vagrant provision`` で反映できます。使い終わったら、 ``vagrant destroy`` でDropletを削除しましょう。


* 参考

  * 仮想環境構築ツール「Vagrant」で開発環境を仮想マシン上に自動作成する : http://knowledge.sakura.ad.jp/tech/1552/
  * Windows7にVirtualBoxとVagrantをインストールしたメモ : http://k-holy.hatenablog.com/entry/2013/08/30/192243 
  * 1円クラウド・ホスティングDigitalOceanを、Vagrantから使ってみる : http://d.hatena.ne.jp/m-hiyama/20140301/1393669079
  * VagrantとSSDなVPS(Digital Ocean)で1時間1円の使い捨て高速サーバ環境を構築する : http://blog.glidenote.com/blog/2013/12/05/digital-ocean-with-vagrant/
  * Vagrant ShareでVagrant環境をインターネット上へ公開する : http://qiita.com/y-mori/items/1f70e7c9d8771f0d939a
  * Vagrant超入門：Vagrant初心者向けの解説だよ！ : https://github.com/tmknom/study-vagrant
  * smdahlen/vagrant-digitalocean : https://github.com/smdahlen/vagrant-digitalocean


仮想化そのに docker
^^^^^^^^^^^^^^^^^^

.. figure:: img/docker-logo.eps
  :scale: 70%
  :alt: docker-logo
  :align: center

  Dockerのロゴ

Dockerとは、たいそう面白いギャグを連発して観客を "どっかーどっかー" 沸かすソフトウエアです。違います。Dockerのgithub曰く「Docker: the Linux container engine」だそうです。LXCだったとかそういう歴史はふっ飛ばして、いきなり実践してみましょう。


インストール
""""""""""""

おや、こんなことろ(DigitalOcean)にDocker入りのイメージがあるじゃないですか。hanayoという名前でDropletsを作りました。OSが立ち上がればインストール完了です。ね、簡単でしょ？

.. figure:: img/dk-do-image.eps
  :scale: 70%
  :alt: dk-do-image
  :align: center

  DigitalOceanのImageにDockerがすでにある！



俺はッ！！本気で！！！！インストールしたいッヒョオッホーーー！！ウーハッフッハーン！！　ッウーン！ [#iidocun]_ な方は、インストールのドキュメントをご覧ください [#iidocins]_ 。CentOS [#iidoccentos]_ やAmazon EC2などにインストールすることができます。バイナリリリース [#iidocbin]_ もあります。

.. [#iidocun] お察し下さい
.. [#iidocins] https://docs.docker.com/installation/#installation
.. [#iidoccentos] CentOS 6以上でカーネル2.6.32-431以上を使ってねってと書いてあります。しかし、カーネルは3系のCentOS7にしておいたほうが良いという先人の言い伝えがあります
.. [#iidocbin] http://docs.docker.com/installation/binaries/


つかってみる
""""""""""""

何ができるか分かっていないのに、公式ドキュメントを読みつつ進めていきます。rootでログインして、 ``docker`` コマンドをたたいてみます。

.. code-block:: sh

   # ssh root@128.199.140.147
   root@hanayo:~# docker
   Usage: docker [OPTIONS] COMMAND [arg...]
    -H=[unix:///var/run/docker.sock]: tcp://host:port to bind/connect to or unix://path/to/socket to use
   
   A self-sufficient runtime for linux containers.
   
   Commands:
       attach    Attach to a running container
       build     Build an image from a Dockerfile
       commit    Create a new image from a container's changes
   
   (略)

docker hubにログインします。アカウントを作ります。

.. code-block:: sh

   root@hanayo:~# docker login
   Username: tboffice
   Password: # 表示されません
   Email: tbofficed@gmail.com
   Account created. Please use the confirmation link we sent to your e-mail to activate it.

メールが届くので、そこに書かれているURLをクリックして登録します。webサイト(https://hub.docker.com/account/signup/)であれば、githubのアカウントでログインアカウントを作ることもできます。次に、アプリケーションを起動してみます。アプリケーションといっても、 ``echo 'Hello World'`` ですが。

.. code-block:: sh

   # docker run ubuntu:14.04 /bin/echo 'Hello world'
   Unable to find image 'ubuntu:14.04' locally
   Pulling repository ubuntu
   e54ca5efa2e9: Download complete 
   511136ea3c5a: Download complete 
   d7ac5e4f1812: Download complete 
   2f4b4d6a4a06: Download complete 
   83ff768040a0: Download complete 
   6c37f792ddac: Download complete 
   Hello world

ubuntu:14.04というイメージを指定しています。そのイメージ(コンテナ)で ``/bin/echo 'Hello world'`` を実行しています。
初回は、数分時間がかかります。実行すると、標準出力結果には残りませんがダウンロードが走ります。これについてはあとで触れます。
いよいよ、コンテナに入ってみましょう。 ``docker run`` でコンテナに対してコマンドを打ちます。

.. code-block:: sh

   # docker run -t -i ubuntu:14.04 /bin/bash
   root@37b8238dbcdd:/# 

入れましたね。-tと-iオプションは、俗にいう、おまじないです。ubuntu:14.04というイメージで ``/bin/bash`` を実行してシェルを掴んできました。

``df`` や ``free`` を打ってディスク、メモリの情報を打ってみたところ、hanayoで実行したときと同じ結果が返ってきます。
ifconfigを打つと、ローカルIPがふられています。外からつなぐにはどうすればいいかは、後ほど。

試しにファイルを置いてみます

.. code-block:: sh

   root@hanayo:~# docker run -t -i ubuntu:14.04 /bin/bash
   root@fc9784ab3cc2:/# touch /tmp/a 
   root@fc9784ab3cc2:/# exit
   root@hanayo:~# ls /tmp/a
   ls: cannot access /tmp/a: No such file or directory

おや、ありませんね。当たり前ですね。hanayoとは独立のOSが立ち上がっています [#iidoca]_ 。次に、コマンドをデーモン化して実行してみましょう。 ``-d`` オプションをつけてデーモン化します。

.. [#iidoca] ちなみにもう一回 bashでコンテナにログインすると、``touch a`` で作ったファイルは消えています

.. code-block:: sh

   # docker run -d ubuntu:14.04 ping www.lovelive-anime.jp
   d7168d2c3b421192a49dc15927b6a1466ab73424bda94e11679af9f8509f369c
   # docker ps 
   CONTAINER ID        IMAGE               COMMAND                CREATED              STATUS              PORTS               NAMES
   d7168d2c3b42        ubuntu:14.04        ping www.lovelive-an   18 seconds ago       Up 18 seconds                           happy_meitner    
   
   # docker logs happy_meitner  | head
   PING www.lovelive-anime.jp (210.138.156.25) 56(84) bytes of data.
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=1 ttl=50 time=114 ms
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=2 ttl=50 time=114 ms
   64 bytes from 25.156.138.210.rev.iijgio.jp (210.138.156.25): icmp_seq=3 ttl=50 time=114 ms

コマンドの標準出力の内容が全て出てきます。もう一回、同じコマンドをたたいても最初から標準出力の内容がでてきます。プロセスを止めます。

.. code-block:: sh

   # sudo docker stop happy_meitner 
   happy_meitner

タスクの名前は、命名規則は「形容詞_人の名前」になってるみたいです。dockerコマンドを単体で叩くと、docker XXX のXXXにあたるオプションの一覧が出てきます。

.. code-block:: sh

   Commands:
       attach    Attach to a running container
       build     Build an image from a Dockerfile
       commit    Create a new image from a container's changes

さっき叩いた ``docker logs`` のヘルプを見てみましょう。

.. code-block:: sh

   root@hanayo:~# docker logs 
   
   Usage: docker logs CONTAINER
   
   Fetch the logs of a container
   
     -f, --follow=false        Follow log output
     -t, --timestamps=false    Show timestamps
     --tail="all"              Output the specified number of lines at the end of logs (defaults to all logs)

Pythonのアプリケーションが入っているイメージを立ち上げてみます。

.. code-block:: sh

   root@hanayo:~# docker run -d -P training/webapp python app.py
   root@hanayo:~# docker ps -l
   CONTAINER ID        IMAGE                    COMMAND             CREATED             STATUS              PORTS                     NAMES
   37179ec8e0bd        training/webapp:latest   python app.py       54 seconds ago      Up 53 seconds       0.0.0.0:49153->5000/tcp   sick_davinci     


41953ポートで待ち受けているのでアクセスしてみしょう [#iidoc49]_ 。

.. [#iidoc49] dockerで起動したアプリケーションは、49000から49900の間のポートを使います。

.. code-block:: sh

   root@hanayo:~# curl localhost:49153
   Hello world!root@hanayo:~# 
   root@hanayo:~# curl -I localhost:49153
   HTTP/1.0 200 OK
   Content-Type: text/html; charset=utf-8
   Content-Length: 12
   Server: Werkzeug/0.8.3 Python/2.7.3
   Date: Mon, 21 Jul 2014 11:47:21 GMT

HTTPサーバが応答していますね。それでは、アプリケーションを止めます。 ``stop`` してからアプリケーションを ``rm`` しましょう。

.. code-block:: sh

   root@hanayo:~# docker stop sick_davinci 
   sick_davinci
   root@hanayo:~# docker rm sick_davinci 
   sick_davinci
   root@hanayo:~# docker ps 
   CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES


病気のダビンチさんはいなくなりました。なお、イメージは残っています。

.. code-block:: sh

   root@hanayo:~# docker images
   REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
   ubuntu              14.04               e54ca5efa2e9        4 weeks ago         276.5 MB
   training/webapp     latest              31fa814ba25a        7 weeks ago         278.8 MB

さてさて、ここまではubuntu:14:04を使っていました。ほかのOSも試してみましょう。

.. code-block:: sh

   # docker pull centos
   Pulling repository centos
   cd934e0010d5: Download complete 
   1a7dc42f78ba: Download complete 
   511136ea3c5a: Download complete 
   34e94e67e63a: Download complete 
   root@hanayo:~#

おもむろにCentOSが持ってこれましたね。初回だけイメージを引っ張ってくるので時間がかかります。2度目以降はすぐにコンテナが起動します。今日も一日がんばるぞい！それでは、ログインしてみましょう。

.. code-block:: sh

   root@hanayo:~# docker run -t -i centos /bin/bash
   bash-4.2# cat /etc/redhat-release 
   CentOS Linux release 7.0.1406 (Core) 
   bash-4.2# 

CentOS 7ですね。hanayoのサーバはUbuntuなのに、Docker上のイメージでCentOSが動作しています。ここで、おもむろにカーネルのバージョンを見てみましょう。

.. code-block:: sh

   bash-4.2# uname -a 
   Linux 4ee22d17ac9a 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux

CentOSなのに、Ubuntuって書いてありますね。ログアウトしてカーネルを見てみます。

.. code-block:: sh

   bash-4.2# exit
   root@hanayo:~# uname -a 
   Linux hanayo 3.13.0-24-generic #46-Ubuntu SMP Thu Apr 10 19:11:08 UTC 2014 x86_64 x86_64 x86_64 GNU/Linux

hanayoとカーネルが一致しますね。Dockerはカーネルだけを共有しています [#iidocker]_ 。公式サイトから図を引用してみます。VMとの違いがなんとなく。なんでしょう。なんですかね。

.. [#iidocker] http://stackoverflow.com/questions/18786209/what-is-the-relationship-between-the-docker-host-os-and-the-container-base-image

.. figure:: img/dk-con.eps
  :scale: 70%
  :alt: dk-con.eps
  :align: center

  https://www.docker.com/whatisdocker/より引用。VMとDockerの違い

そういえばCentOSがインストールされてしまいましたが、どこから持ってきたんでしょうか。答えは、docker hubに登録されているイメージファイルをもってきています。

.. figure:: img/dk-hub-centos.eps
  :scale: 70%
  :alt: dk-hub-centos
  :align: center

  https://registry.hub.docker.com/_/centos/

Dockerのイメージファイルは https://hub.docker.com/ にあるので検索してみてください。え？ブラウザを開くのが面倒？そういう場合は、searchコマンドで探します。すげーたくさん出てきます [#iidocsb]_ 。

.. code-block:: sh

   # docker search centos | head
   NAME                         DESCRIPTION                                     STARS     OFFICIAL   AUTOMATED
   centos                       The official build of CentOS.                   262       [OK]       
   tianon/centos                CentOS 5 and 6, created using rinse instea...   24                   
   blalor/centos                Bare-bones base CentOS 6.5 image                4                    [OK]
   saltstack/centos-6-minimal                                                   4                    [OK]
   stackbrew/centos             The CentOS Linux distribution is a stable,...   3         [OK]       

.. [#iidocsb] stackbrew(https://github.com/dotcloud/stackbrew)というのが公式イメージの一つです。 ``NAME`` は、 ``username/imagename`` と付けるのが流儀。

再度、実行してみましょう。ついでに ``gcc`` をインストールをインストールしてみましょう。CentOSなので、もれなく ``yum install -y gcc`` が打てます。応募者全員サービスです。

.. code-block:: sh

   root@hanayo:~# docker run -t -i centos /bin/bash
   bash-4.2# yum install -y gcc
   (略)
   Complete!
   bash-4.2# ps aux
   USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
   root         1  0.0  0.3  11740  1692 ?        Ss   17:54   0:00 /bin/bash
   root        61  0.0  0.2  19748  1200 ?        R+   17:58   0:00 ps aux
   bash-4.2# exit
   root@hanayo:~# 

おわかりいただけただろうか。 ``ps`` コマンドを打つと、bashのプロセスと自身の ps プロセスしかいないのだ。プロセスのおかわりはいただけないのだろうか。いただけないのである。
何故、こんなことを書いているかというと、コンテナには1つのプロセスしか載せないのである。topを打つともちろん、bashとtopのプロセスしかないのだ！！！な、なんだって！！ ``ΩΩ Ω``

茶番を終わらせるために、いったんbashを抜けて、コンテナをすべて表示してみます。centos:centos7というイメージ上に、0ab61f52d310と31318abf2f23というコンテナがあることがわかります。

.. code-block:: sh

   root@hanayo:~# docker ps -a
   CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                       PORTS               NAMES
   0ab61f52d310        centos:centos7      /bin/bash           8 minutes ago       Exited (130) 4 seconds ago                       furious_mayer       
   31318abf2f23        centos:centos7      /bin/bash           11 minutes ago      Exited (130) 9 minutes ago                       prickly_bardeen     

STATUSがExitedとなっていますね。bashプロセスから抜けると、コンテナは沈黙してしまうのです。では、このコンテナを起動させてみましょう。
そのまえに、便利な ``dl`` コマンドを作りましょう [#iidocdl]_ 。

.. [#iidocdl] 15 Docker Tips in 5 Minutes - http://sssslide.com/speakerdeck.com/bmorearty/15-docker-tips-in-5-minutes

.. code-block:: sh

   root@hanayo:~# alias dl='docker ps -l -q'
   root@hanayo:~# dl
   0ab61f52d310

実行できましたね。

.. code-block:: sh

   root@hanayo:~# docker start `dl`
   0ab61f52d310
   root@hanayo:~# docker attach `dl`
    # 止まったかな？と思っても、Enterを押してください。bashが返ってきますヨ！
   bash-4.2# 
   bash-4.2# rpm -qa | grep ^gcc 
   gcc-4.8.2-16.el7.x86_64

ちゃんと gcc もインストールされていますね。今回はexitせず、 ``ctrl + p`` のあとに、 ``ctrl + q`` を押して抜けます。

.. code-block:: sh

   CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                        PORTS               NAMES
   0ab61f52d310        centos:centos7      /bin/bash           20 minutes ago      Up 5 minutes                                      furious_mayer       
   31318abf2f23        centos:centos7      /bin/bash           23 minutes ago      Exited (130) 21 minutes ago                       prickly_bardeen     

今度は、STATUSがUPになってますね。これで起動中のコンテナが出来ました！
あとはいらないコンテナを削除しましょう。

.. code-block:: sh

   # docker rm prickly_bardeen 
   prickly_bardeen


さあ、ここまできたら、sshで入ってみたいと思いませんか？そうですよね！！そうだと思いましたよ！！！そういうことにしておいてください！！！！


sshでログインする
""""""""""""""""

http://mizzy.org/blog/2014/06/22/1/ を見ながら。

Goが入っていなかったのでインストール。いまさらですけど、DockerはGo製です。

.. code-block:: sh

   root@hanayo:~# apt-get install gccgo-go golang
   root@hanayo:~# export GOPATH=$HOME/_go
   root@hanayo:~# export PATH=$PATH:$GOPATH/bin
   root@hanayo:~# go get github.com/docker/libcontainer/nsinit
   docker-attach()
   {
     id=`sudo docker ps -q --no-trunc $1`
     root=/var/lib/docker/execdriver/native/$id
     sudo sh -c "cd $root && $GOPATH/bin/nsinit exec $2"
   }


nsinitのバイナリができてなくてうまくいかなかった。
どうもパッチ当てないと行けない模様 http://qiita.com/comutt/items/2f873a0e7eaddd3f647e
nsenterでやってみる。gettextが0.18.3でぴったりだった。


shipyard
"""""""""""""""

docker run -i -t -v /var/run/docker.sock:/docker.sock shipyard/deploy setup

数分かかる

dockerを再起動してしまったので再起動。最後のはdocker ps -a でNameをさがしてください。

root@hanayo:~# docker restart shipyard shipyard_db shipyard_lb shipyard_redis shipyard_router determined_tesla 

ブラウザでアクセス。　http://128.199.140.147:8000　

Server Error (500) と表示されてしまった。かなしい。


作ったdockerをpushする

pullもしたいな


さっくりしててよい
http://qiita.com/curseoff/items/a9e64ad01d673abb6866

containerを全部消す

 docker rm `docker ps -aq`
 docker rm `docker ps -a | awk '/iranai/ {print $1}'` 




TODO
sshで入れる方法を示す。commitしてpushして環境を保存する感じで流れる。
yum updateしていても、bashから抜けると変更が消えてしまうことについて触れる

TODO
hostsが書き換えられない
永続化する方法
dockerfileの書き方
肝は docker ps と docker images な感じがする。指定の仕方、何が指定できるかがわかればマスターできそう

VMより良いと書いてあるがどういうことか。
さっくり感想としては、localhostのディレクトリを汚さず、アプリケーションを立ち上げることができるという感じ

ssh で入れるようにするとき
http://mizzy.org/blog/2014/06/22/1/　＜＝これが最新の流れぽい。
http://shibayu36.hatenablog.com/entry/2013/12/07/233510
http://d.hatena.ne.jp/naoya/20130621/
http://www.nerdstacks.net/2014/03/ssh-ready-centos-dockerfile/ sshのキーをつけたしたdockerfile

データ永続化の話
http://qiita.com/mopemope/items/b05ff7f603a5ad74bf55

虎の巻
http://qiita.com/deeeet/items/ed2246497cd6fcfe4104

使えそう？
http://coreos.com/docs/launching-containers/building/getting-started-with-docker/

DockerのOS準備しなくてもオンラインチュートリアルがある　https://www.docker.com/tryit/
と思ったけどあんま使えない印象

なんで今まで使わなかったのか悔やまれる

* inspectコマンド

inspectコマンドあります。Ansibleでいう ``-m setup`` みたいなところ。
コンテナ名(下記でいうところのsick_davinci)は、タブを押すと保管されるので便利といえば便利。ただコンテナをたくさん上げると、候補が沢山出てきて大変になる

root@hanayo:~# docker ps -l
CONTAINER ID        IMAGE                    COMMAND             CREATED             STATUS              PORTS                     NAMES
37179ec8e0bd        training/webapp:latest   python app.py       3 hours ago         Up 3 hours          0.0.0.0:49153->5000/tcp   sick_davinci        
root@hanayo:~# docker inspect sick_davinci 
[{
    "Args": [
        "app.py"
    ],
    "Config": {
        "AttachStderr": false,
        "AttachStdin": false,
        "AttachStdout": false,
        "Cmd": [
            "python",
            "app.py"
        ],
(略)

一部のキーを取り出すにはこんな感じ

root@hanayo:~# docker inspect -f '{{ .NetworkSettings.IPAddress }}' sick_davinci 
172.17.0.9


関連書籍・URL
"""""""""""""


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
