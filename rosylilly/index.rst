AWS をコード化する
==================

おはようございます。最近、暑さにやられていて人生を儚んでいる鳩こと、ロージーです。

今回は AWS をコード化する、ということで、実際に使用している、いくつかのコード例と共に、 AWS の各パーツをコード化していきましょう。

なぜコード化するのか
--------------------

本題に入る前に、まずはなぜコード化しなくてはならないのか、何が嬉しいのか？について少しお話します。

まず筆者のことから話していくと、インフラ周りはさっぱりの、もっぱらフロントやサーバーサイドアプリケーションを書くのがメインの仕事をいままでやってきました。自分のドメインをいくつか所持していたり、 VPS を借りてサーバーで遊んだり、ということはいくらかやってきましたから、まったくのズブの素人、という訳でもなく、なんとなくわからなくもないけど深い知識や知見などは一切ない、という状態です。

こういう状態の人間がインフラを触り始めるとほぼ確実に起こすミスとして、『何をしたのか覚えていないので再現できない』というのがあります。たとえば、新しく起動した EC2 上でセットアップをしたものの、どういうセットアップをしたのか覚えていない、 Route 53 を使って設定したが、どれを設定し終えて、どれがまだなのかわからなくなった、などなど。AWS コンソールは非常に良く出来ており、GUI をつかって手軽に AWS を扱うことが出来ますが、手軽にできすぎて何をしたのか、何をしてないのかわからなくなってしまう、ということが多々あります。

かといって、何をしたのか全部記録しておきましょう！といっても難しいものがあります(今は CloudTrail がありますから、記録するだけならそんなに手間もなく行えるのですが)。できれば作業と同時に記録を行い、かつ後で見返すのが容易で、もっと言うなら実行前に誰かにレビューしてもらえるのが望ましいでしょう。

AWS をコード化する、ということは、作業手順書をなくし、作業そのものがコード化されることで記録・レビュー・実行を1つのコードからワンストップで扱えることになるということです。なので、AWS のコード化は慣れた人よりも初心者こそやるべきだと思っています。

AWS の操作をコード化しておくことで、様々な恩恵を得られるのは間違いないですが、一旦難しいことは考えず、ぱぱっとやっていきましょう。

Route 53
--------

ドメインの設定はとても重要です。設定がミスしていると大変なことになりますし、出来る限りヒューマンエラーを無くしたい箇所でしょう。

今回は Ruby で実装された roadworker(\ https://github.com/winebarrel/roadworker) を利用して Route 53 の設定をコード化していきましょう。

roadworker のインストールと設定
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

特に難しいことはありません。素直に ``gem install roadworker`` でインストールをしましょう。rbenv をお使いの場合は、インストール後に ``rbenv rehash`` を行うのを忘れないように気をつけてください。

roadworker はコマンドライン引数から AWS のアクセスキーとシークレットアクセスキーを渡すことが出来ますが、できれば ``AWS_ACCESS_KEY_ID`` と ``AWS_SECRET_ACCESS_KEY`` を利用した認証を使用しましょう。

また、バージョンを固定する、インストールの簡略化という意味でも、Gemfile をプロジェクトルートに配置して、roadworker を追加しておくのもよいでしょう。Bundler で管理できるようになり、より便利に取り扱う事ができます。

最初の一歩: Export による Routefile の生成
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

roadworker は **Routefile** と呼ばれる独自の DSL を解釈して、 Route 53 の設定を行います。ただ、現在の設定を上書きなどしてしまうと問題ですので、現在の Route 53 の設定を書き出すところから始めましょう。

.. code:: shell

    $ roadwork -e -o Routefile
    # Bundler で管理している場合は以下
    $ bundle exec roadwork -e -o Routefile

上記のコマンドを実行すると、カレントディレクトリの ``Routefile`` に Route 53 の現在のレコードがすべて出力されます。

.. code:: ruby

    hosted_zone "example.com." do
      rrset "example.com.", "A" do
        ttl 300
        resource_records(
          "127.0.0.1",
          "127.0.0.2"
        )
      end
    end

Protip: 上書き注意！
''''''''''''''''''''

roadworker による Export は現在の設定内容を書き出してくれますが、当然、現在の Routefile の書式に合わせるといった変換は行われません。そのため、うっかり書き出してしまうと現在の Routefile の内容が失われてしまう、といったことも起こりえます。

``-o`` オプションを付けないことで、標準出力に Export 結果を出力してくれますから、単に確認を行うだけの場合には ``-o`` を付けず、標準出力に書きだすようにすることをオススメします。

roadworker の DSL を理解する
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

``hosted_zone``
^^^^^^^^^^^^^^^

そのまま、Route 53 の Hosted Zone のことを指しています。たとえば、 ``nicovideo.jp`` なら、

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      # ...
    end

と記述します。最後の ``.`` が必須なことを忘れないように気をつけてください。

この ``hosted_zone`` に渡すブロックの中で、その Hosted Zone の各 Record Set の設定を行っていきます。

``rrset``
^^^^^^^^^

Route 53 の Record Set のことを指しています。Hosted Zone 内の A レコードなどの具体的な設定の記述になります。

たとえば、 ``blog.nicovideo.jp`` を Tumblr で運用する、といった設定の場合

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "blog.nicovideo.jp.", "CNAME" do
        ttl 300
        resource_records(
          "domains.tumblr.com."
        )
      end
    end

といった形で、 ``domains.tumblr.com`` への CNAME のレコードを設定すればよいでしょう。

その他属性値
^^^^^^^^^^^^

``ttl``\ 、\ ``resource_records`` などは、一般的な DNS で設定する内容そのままですから、あまり混乱はないかと思います。ですが Route 53 には他の DNS にはないユニークな機能が幾つか搭載されており、その制御も roadworker から行うことが出来ます。

ここでは2つの機能を紹介します。

Elastic Load Balancer や S3 を用いた場合の Alias A レコード
'''''''''''''''''''''''''''''''''''''''''''''''''''''''''''

Elastic Load Balancer を使って、動的な IP の付与とロードバランシングを行う場合、 CNAME で ELB 名を指定するのではなく、A レコードの ALIAS を使って指定することが出来ます。

Management Console では A レコードタイプを選択して Alias オプションを有効にすることで指定を行うことが出来ますが、 roadworker を利用する場合、以下のような指定で、目的の設定を行う事ができます。

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        dns_name "niconico-frontend-elb-123456789.ap-northeast-1.elb.amazonaws.com."
      end
    end

S3 に Alias を設定する場合も同様に

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        dns_name "www.nicovideo.jp.s3.amazonaws.com."
      end
    end

という具合に指定してあげれば問題ありません。

Failover を利用した動的なドメイン切り替え
'''''''''''''''''''''''''''''''''''''''''

Route 53 には Failover 機能があり、ヘルスチェックと組み合わせることで、サービスダウン時には自動的にレコードを切り替える、といった運用が可能になります(もちろん、クライアント側で名前解決結果をキャッシュしている可能性がありますから、過信は禁物ですが)。

.. code:: ruby

    hosted_zone "nicovideo.jp." do
      rrset "www.nicovideo.jp.", "A" do
        set_identifier "Primary"
        failover "PRIMARY"
        health_check(
          "http://www.nicovideo.jp/health",
          search_string: "OK",
          request_interval: 30,
          failure_threshold: 3
        )
        dns_name "niconico-frontend-elb-123456789.ap-northeast-1.elb.amazonaws.com."
      end

      rrset "www.nicovideo.jp.", "A" do
        set_identifier "Secondary"
        failover "SECONDARY"
        dns_name "www.nicovideo.jp.s3.amazonaws.com."
      end
    end

上記のような記述をしておくことで、 ``http://www.nicovideo.jp/health`` に 30 秒ごとにヘルスチェック確認が行われるようになります。この際に ``search_string`` に指定した **OK** という文字列がレスポンスに含まれなかった場合、ヘルスチェックは失敗と判定され、 ``failure_threshold`` で指定した回数ヘルスチェックに失敗すると、自動的にセカンダリに指定した S3 の Alias が返るようになります。

静的リソース配信やサービスメンテナンス、突発的障害発生時の救済措置として設定しておくとよいでしょう。

プログラマブル DNS
~~~~~~~~~~~~~~~~~~

roadworker は Ruby で実装されており、その DSL も Ruby 上で動作する Ruby スクリプトとして解釈されます。ということは、Ruby そのものの機能を活用して、プログラマブルな DNS を構築出来ることになります。
