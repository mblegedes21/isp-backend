<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <title>Cetak Return Proyek - {{ '' }}</title>
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000
        }

        .header {
            text-align: center;
            margin-bottom: 10px
        }

        .meta {
            margin-bottom: 10px
        }

        table {
            width: 100%;
            border-collapse: collapse
        }

        th,
        td {
            border: 1px solid #000;
            padding: 6px;
            text-align: left
        }

        @media print {
            @page {
                size: A4 portrait;
                margin: 20mm
            }
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>WarehouseISP</h2>
        <div>Dokumen: Return Proyek - {{ '' }}</div>
    </div>

    <div class="meta">
        <strong>Lokasi:</strong> {{ session('active_location','Pusat') }} | <strong>Tanggal:</strong> {{ date('Y-m-d') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>Produk</th>
                <th>Qty</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>ONU Model X</td>
                <td>3</td>
                <td>Serial listed</td>
            </tr>
            <tr>
                <td>Splitter 1:8</td>
                <td>2</td>
                <td>-</td>
            </tr>
            <tr>
                <td>Kabel Drop (m)</td>
                <td>120</td>
                <td>-</td>
            </tr>
        </tbody>
    </table>

    <div style="margin-top:30px">
        <div style="float:left; width:33%">Gudang<br /><br /><br />__________________</div>
        <div style="float:left; width:33%">Leader<br /><br /><br />__________________</div>
        <div style="float:left; width:33%">Owner<br /><br /><br />__________________</div>
    </div>
</body>

</html>

