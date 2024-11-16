import sys
import time
from colorama import init, Fore, Style

init(autoreset=True)

def print_streaming(text, delay=0.05, color=Fore.WHITE):
    """
    一文字ずつストリーミングのように標準出力する関数
    :param text: 出力する文字列
    :param delay: 各文字の出力間隔 (秒)
    :param color: 文字色 (colorama を使った色指定)
    """
    for char in text:
        sys.stdout.write(color + char)
        sys.stdout.flush()
        time.sleep(delay)
    print()  # 最後に改行

# ユーザーからデータを入力
def get_user_input():
    print_streaming("あなたの好みを教えてください．", delay=0.0, color=Fore.CYAN)

    # alpha_values の入力
    alpha_values = []
    print_streaming("これからの質問には-5~5の範囲の整数で回答してください．", delay=0.0, color=Fore.YELLOW)

    # alpha1: 授業日数を少なくしたいか
    print_streaming("授業日数は少ない方がいいですか？(-5: 多い方がいい, 0: どっちでもいい, 5: 少ない方がいい): ", delay=0.0)
    alpha1 = float(input())
    alpha_values.append(alpha1)

    # alpha2: 宿題をどれくらいしたくないか
    print_streaming("宿題はどれくらいしたくないですか？(-5: 多い方がいい, 0: どっちでもいい, 5: したくない): ", delay=0.0)
    alpha2 = float(input())
    alpha_values.append(alpha2)

    # alpha3: 単位数を多く取りたいか
    print_streaming("単位数は多い方がいいですか？(-5: 多い方がいい, 0: どっちでもいい, 5: 少ない方がいい): ", delay=0.0)
    alpha3 = float(input())
    alpha_values.append(alpha3)

    # alpha4: リモート授業が好きかどうか
    print_streaming("リモート授業は好きですか？(-5: 好き, 0: どっちでもいい, 5: 好きではない): ", delay=0.0)
    alpha4 = float(input())
    alpha_values.append(alpha4)

    # alpha5: 興味のある授業をどれくらい優先したいか
    print_streaming("どれくらい自分の興味のある授業を受けたいですか？(-5: 興味のない授業も受けたい, 0: どっちでもいい, 5: 興味のある授業を受けたい): ", delay=0.0)
    alpha5 = float(input())
    alpha_values.append(alpha5)

    # alpha6: 早朝の授業がどれくらい嫌か
    print_streaming("早朝の授業はどれくらい嫌ですか？(-5: 好き, 0: どっちでもいい, 5: 嫌): ", delay=0.00)
    alpha6 = float(input())
    alpha_values.append(alpha6)

    # alpha7: テストのある授業が嫌かどうか
    print_streaming("テストのある授業は嫌ですか？(-5: 好き, 0: どっちでもいい, 5: 嫌): ", delay=0.0)
    alpha7 = float(input())
    alpha_values.append(alpha7)

    print_streaming("ここからは整数で回答してください．", delay=0.0, color=Fore.YELLOW)

    # L_early の入力
    print_streaming("早朝授業の判定を行う授業開始時間の上限（L_early、例: 1限の8:50ならば1、2限の10:30ならば2）を入力してください: ", delay=0.0)
    L_early = int(input())

    # min_units と max_units の入力
    print_streaming("最低単位数を入力してください: ", delay=0.0)
    min_units = int(input())
    print_streaming("最大単位数を入力してください: ", delay=0.0)
    max_units = int(input())

    print_streaming("ここからは日本語の文章，もしくは単語で回答してください．", delay=0.0, color=Fore.YELLOW)
    user_prefer = input("興味のある授業のキーワードを入力してください: ")

    return alpha_values, L_early, min_units, max_units, user_prefer