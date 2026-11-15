// iPhone・Android：レポートを PDF にして、共有シート（印刷・保存・送信）を開く。送り先は飼い主さんが選ぶ。
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const canMakePdf = true;

export async function sharePdf(html: string, title: string) {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
  } else {
    await Print.printAsync({ uri });
  }
}
